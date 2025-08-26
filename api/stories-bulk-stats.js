import { connectToDatabase } from "../lib/mongodb.js";
import { Story, Comment } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[BULK STATS API] ${req.method} /api/stories-bulk-stats`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { storyIds } = req.query;

    if (!storyIds) {
      return res.status(400).json({
        success: false,
        message: "storyIds parameter is required (comma-separated list)",
      });
    }

    // Parse story IDs from query parameter
    const ids = Array.isArray(storyIds) ? storyIds : storyIds.split(",");
    console.log(`[BULK STATS API] Getting stats for ${ids.length} stories`);

    await connectToDatabase();

    // Get stories with stats in one query - use correct schema field names
    const stories = await Story.find({
      storyId: { $in: ids },
    }).select("storyId views likeCount averageRating ratingCount commentCount");

    // Get real comment counts in one aggregation
    const commentCounts = await Comment.aggregate([
      { $match: { storyId: { $in: ids } } },
      { $group: { _id: "$storyId", count: { $sum: 1 } } },
    ]);

    // Create comment count map
    const commentCountMap = {};
    commentCounts.forEach((item) => {
      commentCountMap[item._id] = item.count;
    });

    // Build response with actual stats - correct field mapping
    const statsMap = {};
    stories.forEach((story) => {
      const storyObj = story.toObject();
      const storyStats = {
        viewCount: storyObj.views || 0, // Schema field: views -> response: viewCount
        likeCount: storyObj.likeCount || 0,
        rating: storyObj.averageRating || 0, // Schema field: averageRating -> response: rating
        ratingCount: storyObj.ratingCount || 0,
        commentCount: commentCountMap[story.storyId] || 0, // Use real comment count
      };

      // Debug logging for specific story
      if (story.storyId.toLowerCase().includes("amsterdam") || story.storyId.toLowerCase().includes("cram")) {
        console.log(`[BULK STATS API] 🔍 STORY DEBUG (${story.storyId}):`, {
          storyId: story.storyId,
          schemaViews: storyObj.views,
          responseViewCount: storyStats.viewCount,
          schemaAverageRating: storyObj.averageRating,
          responseRating: storyStats.rating,
          schemaRatingCount: storyObj.ratingCount,
          responseRatingCount: storyStats.ratingCount,
          dbCommentCount: storyObj.commentCount,
          realCommentCount: commentCountMap[story.storyId],
          finalStats: storyStats,
          allSchemaFields: Object.keys(storyObj),
        });
      }

      statsMap[story.storyId] = storyStats;
    });

    console.log(
      `[BULK STATS API] ✅ Retrieved stats for ${Object.keys(statsMap).length} stories`,
    );

    return res.status(200).json({
      success: true,
      stats: statsMap,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[BULK STATS API] ❌ Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to get bulk stats",
      error: error.message,
    });
  }
}
