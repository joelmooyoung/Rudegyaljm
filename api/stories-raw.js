import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[STORIES RAW API] ${req.method} /api/stories`);

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
    console.log("[STORIES RAW API] Connecting to database...");
    await connectToDatabase();
    
    console.log("[STORIES RAW API] Getting database collections...");
    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    const commentsCollection = db.collection('comments');
    
    console.log("[STORIES RAW API] Querying published stories...");
    const stories = await storiesCollection.find({ published: true })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`[STORIES RAW API] Found ${stories.length} published stories`);

    if (stories && stories.length > 0) {
      console.log("[STORIES RAW API] Transforming stories without comment aggregation...");
      const transformedStories = stories.map((story) => {
        // Use the commentCount field from the story document itself
        const commentCount = story.commentCount || 0;

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
          // Use the actual field names from the database
          viewCount: story.views || story.viewCount || 0,
          rating: story.averageRating || story.rating || 0,
          ratingCount: story.ratingCount || 0,
          likeCount: story.likeCount || 0,
          commentCount: commentCount, // Use real comment count
          image: story.image || null,
          audioUrl: story.audioUrl || null,
        };
      });

      console.log(`[STORIES RAW API] Returning test response`);
      return res.json({
        success: true,
        message: "MongoDB stories loaded successfully",
        count: transformedStories.length,
        sample: {
          title: transformedStories[0]?.title,
          author: transformedStories[0]?.author,
          viewCount: transformedStories[0]?.viewCount,
          rating: transformedStories[0]?.rating
        }
      });
    } else {
      console.log("[STORIES RAW API] No stories found");
      return res.json([]);
    }

  } catch (error) {
    console.error("[STORIES RAW API] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stories",
      error: error.message
    });
  }
}
