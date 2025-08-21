import mongoose from "mongoose";
import { connectToDatabase } from "../lib/mongodb.js";

export default async function handler(req, res) {
  console.log(`[STORIES MINIMAL] ${req.method} /api/stories-minimal`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12; // Default to 12 stories per page
  const skip = (page - 1) * limit;

  try {
    console.log("[STORIES MINIMAL] Loading minimal story metadata...");

    // Connect to database
    await connectToDatabase();

    if (mongoose.connection.readyState !== 1) {
      console.log("[STORIES MINIMAL] Database not connected");
      return res.status(500).json({
        success: false,
        message: "Database connection not available"
      });
    }
    
    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    
    console.log(`[STORIES MINIMAL] Getting story data for page ${page} (limit: ${limit})...`);

    // Get total count for pagination
    const totalStories = await storiesCollection.countDocuments({ published: true });
    const totalPages = Math.ceil(totalStories / limit);

    console.log(`[STORIES MINIMAL] Total: ${totalStories} stories, ${totalPages} pages`);

    // Load stories with basic info only - minimal fields to prevent timeout
    const stories = await storiesCollection.find(
      { published: true },
      {
        projection: {
          storyId: 1,
          title: 1,
          author: 1,
          category: 1,
          accessLevel: 1,
          createdAt: 1,
          viewCount: 1,
          views: 1,
          likeCount: 1,
          commentCount: 1,
          rating: 1,
          averageRating: 1,
          ratingCount: 1
          // Still exclude large fields like content and image
        }
      }
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
    
    console.log(`[STORIES MINIMAL] Retrieved ${stories.length} story records for page ${page}`);

    if (stories && stories.length > 0) {
      const transformedStories = stories.map((story) => ({
        id: story.storyId || story._id.toString(),
        title: story.title || "Untitled",
        content: "Click to read this captivating story...", // Simple placeholder
        excerpt: `A ${story.category || 'passionate'} story by ${story.author}`, // Generated excerpt
        author: story.author || "Unknown Author",
        category: story.category || "Romance",
        tags: ["passion", "romance"], // Simple default tags
        accessLevel: story.accessLevel || "free",
        isPublished: true,
        publishedAt: story.createdAt || new Date(),
        createdAt: story.createdAt || new Date(),
        updatedAt: story.createdAt || new Date(),
        viewCount: story.viewCount || story.views || 0,
        rating: story.rating || story.averageRating || 0,
        ratingCount: story.ratingCount || 0,
        likeCount: story.likeCount || 0,
        commentCount: story.commentCount || 0,
        image: null,  // Disabled due to DB timeout
        audioUrl: null,  // Disabled due to DB timeout
      }));

      console.log(`[STORIES MINIMAL] Returning ${transformedStories.length} stories with images for page ${page}`);
      return res.json({
        stories: transformedStories,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalStories: totalStories,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          limit: limit
        }
      });
    } else {
      console.log("[STORIES MINIMAL] No stories found");
      return res.json({
        stories: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalStories: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          limit: limit
        }
      });
    }

  } catch (error) {
    console.error("[STORIES MINIMAL] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load minimal stories",
      error: error.message
    });
  }
}
