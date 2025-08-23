// Simple debug endpoint to check story count issues
import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[SIMPLE STORY DEBUG] ${req.method} /api/simple-story-debug`);

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
        debug: "Cannot connect to MongoDB"
      });
    }

    // Get total count
    const totalStories = await Story.countDocuments({});
    
    // Get published count
    const publishedStories = await Story.countDocuments({ published: true });
    
    // Get unpublished count  
    const unpublishedStories = await Story.countDocuments({ published: false });

    // Test admin query (what StoryMaintenance should use)
    const adminQuery = {}; // Empty query for admin=true
    const adminStories = await Story.find(adminQuery)
      .sort({ createdAt: -1 })
      .select("storyId title published author createdAt")
      .limit(50); // Limit to first 50 to see what we get

    // Test public query  
    const publicQuery = { published: true };
    const publicStories = await Story.find(publicQuery)
      .sort({ createdAt: -1 })
      .select("storyId title published author createdAt")
      .limit(50);

    const result = {
      success: true,
      database_connected: true,
      counts: {
        total: totalStories,
        published: publishedStories,
        unpublished: unpublishedStories
      },
      admin_query_results: {
        count: adminStories.length,
        stories: adminStories.map(s => ({
          id: s.storyId,
          title: s.title,
          published: s.published,
          author: s.author,
          createdAt: s.createdAt
        }))
      },
      public_query_results: {
        count: publicStories.length,
        stories: publicStories.slice(0, 10).map(s => ({
          id: s.storyId,
          title: s.title,
          published: s.published,
          author: s.author,
          createdAt: s.createdAt
        }))
      },
      analysis: {
        issue_identified: adminStories.length !== totalStories,
        expected_admin_count: totalStories,
        actual_admin_count: adminStories.length,
        recommendation: adminStories.length < totalStories ? 
          "There appears to be a query limitation or filtering issue" : 
          "Admin query is returning all stories as expected"
      }
    };

    console.log(`[SIMPLE STORY DEBUG] Results:`, {
      total: totalStories,
      published: publishedStories,
      unpublished: unpublishedStories,
      admin_returned: adminStories.length
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error(`[SIMPLE STORY DEBUG] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      debug: "Failed to query database"
    });
  }
}
