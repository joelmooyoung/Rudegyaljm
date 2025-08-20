import { connectToDatabase } from "../../lib/mongodb.js";
import { Story, Like, Rating, Comment } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[REFRESH STATS] ${req.method} /api/admin/refresh-stats - REDIRECTING TO UNIFIED STATS`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    console.log("[REFRESH STATS] Connected to database");

    if (req.method === "GET") {
      // Return current stats from MongoDB (same as unified-stats)
      const stories = await Story.find({}).select("storyId title viewCount likeCount rating ratingCount commentCount");

      const stats = {};
      for (const story of stories) {
        const storyObj = story.toObject();
        stats[story.storyId] = {
          title: story.title,
          viewCount: storyObj.viewCount || 0,
          likeCount: storyObj.likeCount || 0,
          rating: storyObj.rating || 0,
          ratingCount: storyObj.ratingCount || 0,
          commentCount: storyObj.commentCount || 0,
        };
      }

      return res.status(200).json({
        success: true,
        message: "Stats retrieved successfully (from MongoDB)",
        storyCount: Object.keys(stats).length,
        stats: stats,
        source: "MongoDB",
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "POST") {
      const { action, storyId, testData } = req.body;

      if (action === "refresh-all") {
        // Refresh all story stats
        const stats = await getAllStats();
        const refreshedStats = {};

        for (const storyId of Object.keys(stats)) {
          const currentStats = stats[storyId];
          // Recalculate derived values
          currentStats.likeCount = currentStats.likes ? currentStats.likes.length : 0;
          currentStats.ratingCount = currentStats.ratings ? currentStats.ratings.length : 0;
          currentStats.viewCount = currentStats.views ? currentStats.views.length : 0;

          // Recalculate average rating
          if (currentStats.ratings && currentStats.ratings.length > 0) {
            const totalRating = currentStats.ratings.reduce((sum, r) => sum + r.rating, 0);
            currentStats.rating = Number((totalRating / currentStats.ratings.length).toFixed(1));
          }

          refreshedStats[storyId] = await updateStoryStats(storyId, currentStats);
        }

        return res.status(200).json({
          success: true,
          message: "All stats refreshed successfully",
          refreshedCount: Object.keys(refreshedStats).length,
          stats: refreshedStats,
          timestamp: new Date().toISOString(),
        });
      }

      if (action === "add-test-data" && storyId && testData) {
        // Add test interactions for a specific story
        const { views, likes, ratings, comments } = testData;
        const currentStats = await getAllStats();
        const storyStats = currentStats[storyId] || {
          viewCount: 0,
          likeCount: 0,
          rating: 0,
          ratingCount: 0,
          commentCount: 0,
          likes: [],
          ratings: [],
          views: [],
        };

        // Add test views
        if (views) {
          for (let i = 0; i < views; i++) {
            storyStats.views.push({
              userId: `test_user_${i}_${Date.now()}`,
              sessionId: `test_session_${i}_${Date.now()}`,
              timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        }

        // Add test likes
        if (likes) {
          for (let i = 0; i < likes; i++) {
            const userId = `test_liker_${i}_${Date.now()}`;
            if (!storyStats.likes.includes(userId)) {
              storyStats.likes.push(userId);
            }
          }
        }

        // Add test ratings
        if (ratings) {
          for (let i = 0; i < ratings; i++) {
            storyStats.ratings.push({
              userId: `test_rater_${i}_${Date.now()}`,
              rating: Math.floor(Math.random() * 5) + 1,
              timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        }

        // Add test comments count
        if (comments) {
          storyStats.commentCount = (storyStats.commentCount || 0) + comments;
        }

        const updatedStats = await updateStoryStats(storyId, storyStats);

        return res.status(200).json({
          success: true,
          message: "Test data added successfully",
          storyId: storyId,
          updatedStats: updatedStats,
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid action or missing parameters",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });

  } catch (error) {
    console.error("[REFRESH STATS] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh stats",
      error: error.message,
    });
  }
}
