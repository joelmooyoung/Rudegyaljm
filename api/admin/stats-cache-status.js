import { connectToDatabase } from "../../lib/mongodb.js";
import { StoryStatsCache, Story } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[STATS CACHE STATUS] ${req.method} /api/admin/stats-cache-status`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    // Get cache statistics
    const totalPublishedStories = await Story.countDocuments({ published: true });
    const totalCachedStats = await StoryStatsCache.countDocuments();
    
    // Get most recent cache entry
    const latestCache = await StoryStatsCache.findOne()
      .sort({ lastCalculated: -1 })
      .select('lastCalculated calculationDurationMs calculationVersion');

    // Get cache coverage
    const coverage = totalPublishedStories > 0 
      ? Math.round((totalCachedStats / totalPublishedStories) * 100)
      : 0;

    // Get cache age
    const cacheAge = latestCache?.lastCalculated 
      ? Date.now() - new Date(latestCache.lastCalculated).getTime()
      : null;

    // Get sample stats
    const sampleStats = await StoryStatsCache.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$viewCount" },
          totalLikes: { $sum: "$likeCount" },
          totalComments: { $sum: "$commentCount" },
          totalRatings: { $sum: "$ratingCount" },
          averageRating: { $avg: "$rating" },
          entriesWithStats: { $sum: 1 }
        }
      }
    ]);

    const aggregateStats = sampleStats[0] || {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalRatings: 0,
      averageRating: 0,
      entriesWithStats: 0
    };

    const status = {
      cacheHealth: {
        isActive: totalCachedStats > 0,
        coverage: `${coverage}%`,
        totalPublishedStories,
        totalCachedStats,
        lastUpdate: latestCache?.lastCalculated || null,
        cacheAgeMs: cacheAge,
        cacheAgeHuman: cacheAge ? formatDuration(cacheAge) : null,
        lastCalculationTime: latestCache?.calculationDurationMs || null,
        version: latestCache?.calculationVersion || null
      },
      aggregateStats: {
        totalViews: aggregateStats.totalViews,
        totalLikes: aggregateStats.totalLikes,
        totalComments: aggregateStats.totalComments,
        totalRatings: aggregateStats.totalRatings,
        averageRating: Math.round(aggregateStats.averageRating * 10) / 10,
        storiesWithStats: aggregateStats.entriesWithStats
      },
      recommendations: []
    };

    // Add recommendations based on status
    if (coverage < 100) {
      status.recommendations.push(`Cache incomplete: Only ${coverage}% of stories have cached stats. Run stats calculation.`);
    }
    
    if (cacheAge && cacheAge > 24 * 60 * 60 * 1000) { // 24 hours
      status.recommendations.push(`Cache is stale: Last updated ${status.cacheHealth.cacheAgeHuman} ago. Consider refreshing.`);
    }

    if (totalCachedStats === 0) {
      status.recommendations.push("No cached stats found. Run initial stats calculation to enable high-performance mode.");
    }

    return res.status(200).json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[STATS CACHE STATUS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get cache status",
      error: error.message
    });
  }
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.floor(ms / 1000)}s`;
}
