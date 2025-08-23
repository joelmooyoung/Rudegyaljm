// Simple test to verify diagnostic API is working
import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[TEST DIAGNOSTIC SIMPLE] ${req.method} /api/test-diagnostic-simple`);

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
      return res.status(200).json({
        success: false,
        message: "Database not connected",
        test: "connection_failed"
      });
    }

    // Simple count test
    const totalStories = await Story.countDocuments({});
    console.log(`[TEST DIAGNOSTIC SIMPLE] Found ${totalStories} stories`);

    // Get first story for testing
    const firstStory = await Story.findOne({}).select("storyId title author createdAt");
    
    const result = {
      success: true,
      test: "passed",
      database_connected: true,
      total_stories: totalStories,
      first_story: firstStory ? {
        id: firstStory.storyId || 'unknown',
        title: firstStory.title || 'Untitled',
        author: firstStory.author || 'Unknown',
        createdAt: firstStory.createdAt ? firstStory.createdAt.toISOString() : null
      } : null,
      timestamp: new Date().toISOString()
    };

    // Test JSON serialization
    try {
      const testJson = JSON.stringify(result);
      console.log(`[TEST DIAGNOSTIC SIMPLE] JSON test passed (${testJson.length} chars)`);
    } catch (jsonError) {
      console.error(`[TEST DIAGNOSTIC SIMPLE] JSON test failed:`, jsonError);
      return res.status(500).json({
        success: false,
        message: "JSON serialization failed",
        error: jsonError.message
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error(`[TEST DIAGNOSTIC SIMPLE] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      test: "failed"
    });
  }
}
