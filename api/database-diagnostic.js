// Comprehensive database diagnostic to find missing stories
import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[DATABASE DIAGNOSTIC] ${req.method} /api/database-diagnostic`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    // Connect to MongoDB
    const dbConnection = await connectToDatabase();

    if (!dbConnection.isConnected) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    const diagnostic = {
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnection.isConnected,
        connectionString: process.env.MONGODB_URI ? "SET" : "NOT SET"
      },
      collections: {},
      stories: {
        total: 0,
        published: 0,
        unpublished: 0,
        byAuthor: {},
        byCategory: {},
        createdToday: 0,
        createdThisWeek: 0,
        createdThisMonth: 0,
        oldestStory: null,
        newestStory: null,
        sampleStories: []
      }
    };

    // Get database connection
    const db = dbConnection.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    diagnostic.collections.available = collections.map(c => c.name);
    diagnostic.collections.count = collections.length;

    // Check if stories collection exists
    const storiesCollectionExists = collections.some(c => c.name === 'stories');
    diagnostic.collections.storiesExists = storiesCollectionExists;

    if (!storiesCollectionExists) {
      diagnostic.issues = ["Stories collection does not exist"];
      return res.status(200).json(diagnostic);
    }

    // Get collection stats
    const storiesCollection = db.collection('stories');
    const collectionStats = await storiesCollection.stats();
    diagnostic.collections.storiesStats = {
      count: collectionStats.count,
      size: collectionStats.size,
      avgObjSize: collectionStats.avgObjSize
    };

    // Count total stories
    diagnostic.stories.total = await Story.countDocuments({});

    if (diagnostic.stories.total === 0) {
      diagnostic.issues = ["No stories found in database"];
      return res.status(200).json(diagnostic);
    }

    // Count published/unpublished
    diagnostic.stories.published = await Story.countDocuments({ published: true });
    diagnostic.stories.unpublished = await Story.countDocuments({ published: false });

    // Get all stories for analysis
    const allStories = await Story.find({})
      .sort({ createdAt: -1 })
      .select("storyId title author category published createdAt");

    // Analyze by author
    allStories.forEach(story => {
      const author = story.author || 'Unknown';
      diagnostic.stories.byAuthor[author] = (diagnostic.stories.byAuthor[author] || 0) + 1;
    });

    // Analyze by category
    allStories.forEach(story => {
      const category = story.category || 'Unknown';
      diagnostic.stories.byCategory[category] = (diagnostic.stories.byCategory[category] || 0) + 1;
    });

    // Analyze by date
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    diagnostic.stories.createdToday = await Story.countDocuments({
      createdAt: { $gte: todayStart }
    });

    diagnostic.stories.createdThisWeek = await Story.countDocuments({
      createdAt: { $gte: weekStart }
    });

    diagnostic.stories.createdThisMonth = await Story.countDocuments({
      createdAt: { $gte: monthStart }
    });

    // Get oldest and newest stories with safe date handling
    if (allStories.length > 0) {
      diagnostic.stories.newestStory = {
        id: allStories[0].storyId || 'unknown',
        title: allStories[0].title || 'Untitled',
        author: allStories[0].author || 'Unknown Author',
        createdAt: allStories[0].createdAt ? allStories[0].createdAt.toISOString() : new Date().toISOString()
      };

      diagnostic.stories.oldestStory = {
        id: allStories[allStories.length - 1].storyId || 'unknown',
        title: allStories[allStories.length - 1].title || 'Untitled',
        author: allStories[allStories.length - 1].author || 'Unknown Author',
        createdAt: allStories[allStories.length - 1].createdAt ? allStories[allStories.length - 1].createdAt.toISOString() : new Date().toISOString()
      };
    }

    // Sample of all stories with safe data handling
    diagnostic.stories.sampleStories = allStories.map(story => ({
      id: story.storyId || 'unknown',
      title: story.title || 'Untitled',
      author: story.author || 'Unknown Author',
      category: story.category || 'Unknown',
      published: Boolean(story.published),
      createdAt: story.createdAt ? story.createdAt.toISOString() : new Date().toISOString()
    }));

    // Check for potential issues
    diagnostic.issues = [];

    if (diagnostic.stories.total < 10) {
      diagnostic.issues.push(`Only ${diagnostic.stories.total} stories found - this seems low for a production site`);
    }

    if (diagnostic.stories.published === 0) {
      diagnostic.issues.push("No published stories found");
    }

    if (diagnostic.stories.createdThisMonth === 0) {
      diagnostic.issues.push("No stories created this month - potential data loss?");
    }

    // Check for duplicate authors (might indicate bulk deletion)
    const authorCounts = Object.values(diagnostic.stories.byAuthor);
    const maxStoriesPerAuthor = Math.max(...authorCounts);
    if (maxStoriesPerAuthor > diagnostic.stories.total * 0.8) {
      diagnostic.issues.push("Most stories by single author - potential bulk deletion of other authors?");
    }

    console.log(`[DATABASE DIAGNOSTIC] Complete:`, {
      total: diagnostic.stories.total,
      published: diagnostic.stories.published,
      authors: Object.keys(diagnostic.stories.byAuthor).length,
      issues: diagnostic.issues.length
    });

    // Ensure all data is JSON-serializable
    try {
      const testSerialization = JSON.stringify(diagnostic);
      console.log(`[DATABASE DIAGNOSTIC] JSON serialization test passed (${testSerialization.length} chars)`);
    } catch (serializationError) {
      console.error(`[DATABASE DIAGNOSTIC] JSON serialization failed:`, serializationError);
      return res.status(500).json({
        success: false,
        message: "Failed to serialize diagnostic data",
        error: serializationError.message,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json(diagnostic);

  } catch (error) {
    console.error(`[DATABASE DIAGNOSTIC] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
