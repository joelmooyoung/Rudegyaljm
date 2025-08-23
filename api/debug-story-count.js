// Debug script to count all stories in the database
import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[DEBUG STORY COUNT] ${req.method} /api/debug-story-count`);

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

    // Count all stories
    const totalCount = await Story.countDocuments({});
    
    // Count published stories
    const publishedCount = await Story.countDocuments({ published: true });
    
    // Count unpublished stories
    const unpublishedCount = await Story.countDocuments({ published: false });
    
    // Get sample of story titles with publish status
    const sampleStories = await Story.find({})
      .select("storyId title published author createdAt")
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`[DEBUG STORY COUNT] Total: ${totalCount}, Published: ${publishedCount}, Unpublished: ${unpublishedCount}`);

    return res.status(200).json({
      success: true,
      totalCount,
      publishedCount,
      unpublishedCount,
      sampleStories: sampleStories.map(story => ({
        id: story.storyId,
        title: story.title,
        published: story.published,
        author: story.author,
        createdAt: story.createdAt
      }))
    });

  } catch (error) {
    console.error(`[DEBUG STORY COUNT] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
