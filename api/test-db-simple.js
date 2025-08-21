import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed" 
    });
  }

  try {
    console.log("[TEST DB] Testing database connection without models...");
    await connectToDatabase();
    
    console.log("[TEST DB] Connection successful, testing raw collection access...");
    
    // Access collection directly without models
    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    
    console.log("[TEST DB] Attempting to count stories...");
    const count = await storiesCollection.countDocuments({ published: true });
    console.log(`[TEST DB] Found ${count} published stories`);
    
    console.log("[TEST DB] Attempting to find first 3 stories...");
    const stories = await storiesCollection.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();
    
    console.log(`[TEST DB] Retrieved ${stories.length} stories successfully`);

    return res.status(200).json({
      success: true,
      message: "Database test successful",
      storyCount: count,
      sampleStories: stories.map(s => ({
        id: s.storyId,
        title: s.title,
        author: s.author,
        views: s.views,
        viewCount: s.viewCount,
        hasFields: Object.keys(s)
      }))
    });

  } catch (error) {
    console.error("[TEST DB] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.message
    });
  }
}
