import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(
    `[STORIES AGGREGATE STATS] ${req.method} /api/stories-aggregate-stats`,
  );

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    if (mongoose.connection.readyState !== 1) {
      console.log("[STORIES AGGREGATE STATS] Database not connected");
      return res.status(500).json({
        success: false,
        message: "Database connection not available",
      });
    }

    const db = mongoose.connection.db;
    const storiesCollection = db.collection("stories");
    const commentsCollection = db.collection("comments");

    console.log(
      "[STORIES AGGREGATE STATS] Calculating aggregate statistics...",
    );

    // Use Promise.race to add timeout protection - reduced for better UX
    const timeoutMs = 3000; // 3 seconds timeout for faster user experience

    const aggregatePromise = Promise.all([
      // Get total published stories count
      storiesCollection.countDocuments({ published: true }),

      // Get aggregate stats from published stories
      storiesCollection
        .aggregate([
          { $match: { published: true } },
          {
            $group: {
              _id: null,
              totalLikes: { $sum: { $ifNull: ["$likeCount", 0] } },
              totalViews: { $sum: { $ifNull: ["$viewCount", 0] } },
              totalRatings: { $sum: { $ifNull: ["$ratingCount", 0] } },
            },
          },
        ])
        .toArray(),

      // Get total comments across all published stories
      commentsCollection
        .aggregate([
          {
            $lookup: {
              from: "stories",
              localField: "storyId",
              foreignField: "storyId",
              as: "story",
            },
          },
          { $match: { "story.published": true } },
          {
            $group: {
              _id: null,
              totalComments: { $sum: 1 },
            },
          },
        ])
        .toArray(),
    ]);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Aggregate stats timeout")), timeoutMs),
    );

    const [totalStories, storyStats, commentStats] = await Promise.race([
      aggregatePromise,
      timeoutPromise,
    ]);

    const aggregateStats = {
      totalStories: totalStories,
      totalLikes: storyStats[0]?.totalLikes || 0,
      totalViews: storyStats[0]?.totalViews || 0,
      totalRatings: storyStats[0]?.totalRatings || 0,
      totalComments: commentStats[0]?.totalComments || 0,
    };

    console.log(
      "[STORIES AGGREGATE STATS] Aggregate statistics:",
      aggregateStats,
    );

    return res.json({
      success: true,
      stats: aggregateStats,
    });
  } catch (error) {
    console.error("[STORIES AGGREGATE STATS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate aggregate stats",
      error: error.message,
    });
  }
}
