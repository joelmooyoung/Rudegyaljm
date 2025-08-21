import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[STORIES FULL API] ${req.method} /api/stories-full`);

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
    console.log("[STORIES FULL API] Connecting to database...");
    await connectToDatabase();
    
    console.log("[STORIES FULL API] Getting stories collection...");
    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    
    console.log("[STORIES FULL API] Querying ALL published stories...");
    const stories = await storiesCollection.find({ published: true })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`[STORIES FULL API] Found ${stories.length} published stories`);

    if (stories && stories.length > 0) {
      console.log("[STORIES FULL API] Transforming stories for frontend...");
      const transformedStories = stories.map((story) => {
        return {
          id: story.storyId || story._id.toString(),
          title: story.title || "Untitled",
          content: story.content || "",
          excerpt: story.excerpt || "",
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

      console.log(`[STORIES FULL API] Returning ${transformedStories.length} MongoDB stories`);
      return res.json(transformedStories);
    } else {
      console.log("[STORIES FULL API] No stories found");
      return res.json([]);
    }

  } catch (error) {
    console.error("[STORIES FULL API] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stories",
      error: error.message
    });
  }
}
