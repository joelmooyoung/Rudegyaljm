import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[STORIES AGGREGATE STATS] ${req.method} /api/stories-aggregate-stats`);

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
        message: "Database connection not available"
      });
    }

    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    const commentsCollection = db.collection('comments');

    console.log("[STORIES AGGREGATE STATS] Calculating aggregate statistics...");

    // Get total published stories count
    const totalStories = await storiesCollection.countDocuments({ published: true });

    // Get aggregate stats from published stories
    const storyStats = await storiesCollection.aggregate([
      { $match: { published: true } },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: { $ifNull: ["$likeCount", 0] } },
          totalViews: { $sum: { $ifNull: ["$viewCount", 0] } },
          totalRatings: { $sum: { $ifNull: ["$ratingCount", 0] } }
        }
      }
    ]).toArray();

    // Get total comments across all published stories
    const commentStats = await commentsCollection.aggregate([
      {
        $lookup: {
          from: 'stories',
          localField: 'storyId',
          foreignField: 'storyId',
          as: 'story'
        }
      },
      { $match: { 'story.published': true } },
      {
        $group: {
          _id: null,
          totalComments: { $sum: 1 }
        }
      }
    ]).toArray();

    const aggregateStats = {
      totalStories: totalStories,
      totalLikes: storyStats[0]?.totalLikes || 0,
      totalViews: storyStats[0]?.totalViews || 0,
      totalRatings: storyStats[0]?.totalRatings || 0,
      totalComments: commentStats[0]?.totalComments || 0
    };

    console.log("[STORIES AGGREGATE STATS] Aggregate statistics:", aggregateStats);

    return res.json({
      success: true,
      stats: aggregateStats
    });

  } catch (error) {
    console.error("[STORIES AGGREGATE STATS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate aggregate stats",
      error: error.message
    });
  }
}
