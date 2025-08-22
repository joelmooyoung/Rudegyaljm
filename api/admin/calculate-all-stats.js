import { connectToDatabase } from "../../lib/mongodb.js";
import { Story, Comment, Like, Rating, StoryStatsCache } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[BATCH STATS] ${req.method} /api/admin/calculate-all-stats`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed - use POST"
    });
  }

  try {
    const startTime = Date.now();
    console.log("[BATCH STATS] 🚀 Starting batch stats calculation...");

    await connectToDatabase();

    // Get all published stories
    const stories = await Story.find({ published: true }).select('storyId title');
    const storyIds = stories.map(s => s.storyId);
    
    console.log(`[BATCH STATS] Found ${stories.length} published stories to process`);

    // Calculate stats in bulk using aggregation pipelines for efficiency
    console.log("[BATCH STATS] 📊 Calculating view counts...");
    const viewCountsMap = new Map();
    stories.forEach(story => {
      // Use the viewCount from the story document (already aggregated from view API calls)
      const storyObj = story.toObject();
      viewCountsMap.set(story.storyId, storyObj.viewCount || storyObj.views || 0);
    });

    console.log("[BATCH STATS] 👍 Calculating like counts...");
    const likeCounts = await Like.aggregate([
      { $match: { storyId: { $in: storyIds } } },
      { $group: { _id: "$storyId", count: { $sum: 1 } } }
    ]);
    const likeCountsMap = new Map(likeCounts.map(item => [item._id, item.count]));

    console.log("[BATCH STATS] 💬 Calculating comment counts...");
    const commentCounts = await Comment.aggregate([
      { $match: { storyId: { $in: storyIds } } },
      { $group: { _id: "$storyId", count: { $sum: 1 } } }
    ]);
    const commentCountsMap = new Map(commentCounts.map(item => [item._id, item.count]));

    console.log("[BATCH STATS] ⭐ Calculating ratings...");
    const ratingStats = await Rating.aggregate([
      { $match: { storyId: { $in: storyIds } } },
      { 
        $group: { 
          _id: "$storyId", 
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 }
        } 
      }
    ]);
    const ratingStatsMap = new Map(ratingStats.map(item => [
      item._id, 
      { 
        rating: Math.round(item.averageRating * 10) / 10, // Round to 1 decimal
        ratingCount: item.ratingCount 
      }
    ]));

    console.log("[BATCH STATS] 💾 Updating stats cache...");
    let updatedCount = 0;
    let createdCount = 0;

    // Update/create cache entries using bulk operations for efficiency
    const bulkOps = stories.map(story => {
      const storyId = story.storyId;
      const ratingData = ratingStatsMap.get(storyId) || { rating: 0, ratingCount: 0 };

      return {
        updateOne: {
          filter: { storyId },
          update: {
            $set: {
              viewCount: viewCountsMap.get(storyId) || 0,
              likeCount: likeCountsMap.get(storyId) || 0,
              commentCount: commentCountsMap.get(storyId) || 0,
              rating: ratingData.rating,
              ratingCount: ratingData.ratingCount,
              lastCalculated: new Date(),
              calculationDurationMs: 0, // Will update after completion
              calculationVersion: "1.0"
            }
          },
          upsert: true
        }
      };
    });

    const result = await StoryStatsCache.bulkWrite(bulkOps);
    updatedCount = result.modifiedCount;
    createdCount = result.upsertedCount;

    const calculationTime = Date.now() - startTime;

    // Update calculation duration for all entries
    await StoryStatsCache.updateMany(
      { lastCalculated: { $gte: new Date(Date.now() - 1000) } }, // Recent entries
      { $set: { calculationDurationMs: calculationTime } }
    );

    console.log(`[BATCH STATS] ✅ Batch calculation completed in ${calculationTime}ms`);
    console.log(`[BATCH STATS] 📈 Updated: ${updatedCount}, Created: ${createdCount} cache entries`);

    // Get aggregate summary
    const totalStats = await StoryStatsCache.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$viewCount" },
          totalLikes: { $sum: "$likeCount" },
          totalComments: { $sum: "$commentCount" },
          totalRatings: { $sum: "$ratingCount" },
          averageRating: { $avg: "$rating" },
          storiesWithStats: { $sum: 1 }
        }
      }
    ]);

    const summary = totalStats[0] || {
      totalViews: 0,
      totalLikes: 0, 
      totalComments: 0,
      totalRatings: 0,
      averageRating: 0,
      storiesWithStats: 0
    };

    return res.status(200).json({
      success: true,
      message: "Batch stats calculation completed successfully",
      timing: {
        totalTimeMs: calculationTime,
        storiesProcessed: stories.length
      },
      results: {
        updated: updatedCount,
        created: createdCount,
        total: updatedCount + createdCount
      },
      summary: {
        totalStories: summary.storiesWithStats,
        totalViews: summary.totalViews,
        totalLikes: summary.totalLikes,
        totalComments: summary.totalComments,
        totalRatings: summary.totalRatings,
        averageRating: Math.round(summary.averageRating * 10) / 10
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[BATCH STATS] ❌ Error during batch calculation:", error);
    return res.status(500).json({
      success: false,
      message: "Batch stats calculation failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
