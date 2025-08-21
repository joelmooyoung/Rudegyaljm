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
    
    console.log("[TEST DB] Attempting to find first 10 stories...");
    const stories = await storiesCollection.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log(`[TEST DB] Retrieved ${stories.length} stories successfully`);

    // Format as proper story objects for the frontend
    const formattedStories = stories.map(s => ({
      id: s.storyId || s._id.toString(),
      title: s.title || "Untitled",
      content: s.content || "Story content available...",
      excerpt: s.excerpt || `A captivating story by ${s.author}`,
      author: s.author || "Unknown Author",
      category: s.category || "Romance",
      tags: Array.isArray(s.tags) ? s.tags : [],
      accessLevel: s.accessLevel || "free",
      isPublished: s.published || false,
      publishedAt: s.publishedAt || s.createdAt,
      createdAt: s.createdAt || new Date(),
      updatedAt: s.updatedAt || new Date(),
      viewCount: s.views || s.viewCount || 0,
      rating: s.averageRating || s.rating || 0,
      ratingCount: s.ratingCount || 0,
      likeCount: s.likeCount || 0,
      commentCount: s.commentCount || 0,
      image: s.image || null,
      audioUrl: s.audioUrl || null,
    }));

    console.log(`[TEST DB] Returning ${formattedStories.length} formatted MongoDB stories`);
    return res.status(200).json(formattedStories);

  } catch (error) {
    console.error("[TEST DB] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.message
    });
  }
}
