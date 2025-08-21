import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[STORIES LIGHT API] ${req.method} /api/stories`);

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

  try {
    console.log("[STORIES LIGHT API] Connecting to database...");
    await connectToDatabase();
    
    console.log("[STORIES LIGHT API] Getting stories collection...");
    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    
    console.log("[STORIES LIGHT API] Querying first 15 stories for performance...");
    const stories = await storiesCollection.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(15)
      .toArray();
    
    console.log(`[STORIES LIGHT API] Found ${stories.length} real MongoDB stories`);

    if (stories && stories.length > 0) {
      console.log("[STORIES LIGHT API] Transforming real MongoDB stories...");
      const transformedStories = stories.map((story) => {
        return {
          id: story.storyId || story._id.toString(),
          title: story.title || "Untitled",
          content: "Story content available - click to read", // Placeholder since we excluded content
          excerpt: story.excerpt || `A story by ${story.author}`,
          author: story.author || "Unknown Author",
          category: story.category || "Romance",
          tags: Array.isArray(story.tags) ? story.tags : [],
          accessLevel: story.accessLevel || "free",
          isPublished: story.published || false,
          publishedAt: story.publishedAt || story.createdAt,
          createdAt: story.createdAt || new Date(),
          updatedAt: story.updatedAt || new Date(),
          // Use the actual field names from your MongoDB
          viewCount: story.views || story.viewCount || 0,
          rating: story.averageRating || story.rating || 0,
          ratingCount: story.ratingCount || 0,
          likeCount: story.likeCount || 0,
          commentCount: story.commentCount || 0,
          image: story.image || null,
          audioUrl: story.audioUrl || null,
        };
      });

      console.log(`[STORIES LIGHT API] Returning ${transformedStories.length} real MongoDB stories`);
      return res.json(transformedStories);
    } else {
      console.log("[STORIES LIGHT API] No stories found");
      return res.json([]);
    }

  } catch (error) {
    console.error("[STORIES LIGHT API] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stories",
      error: error.message
    });
  }
}
