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
      // Get comment counts for all stories in one query
      console.log("[STORIES RAW API] Getting comment counts...");
      const commentCounts = await commentsCollection.aggregate([
        {
          $group: {
            _id: "$storyId",
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      // Create comment count map
      const commentCountMap = {};
      commentCounts.forEach(item => {
        commentCountMap[item._id] = item.count;
      });

      console.log("[STORIES RAW API] Transforming stories...");
      const transformedStories = stories.map((story) => {
        const commentCount = commentCountMap[story.storyId] || 0;

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

      console.log(`[STORIES RAW API] Returning ${transformedStories.length} stories`);
      return res.json(transformedStories);
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
