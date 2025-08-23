import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";
import cacheManager, { CACHE_CONFIG } from "../lib/cache-manager.js";

export default async function handler(req, res) {
  console.log(`[DASHBOARD STATS CACHED] ${req.method} /api/dashboard-stats-cached`);

  // Enable CORS 
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Check cache validity using cache manager
  const forceRefresh = req.query.refresh === 'true';
  const cacheKey = cacheManager.getDashboardStatsKey('cached');

  if (!forceRefresh) {
    const cachedData = await cacheManager.get(cacheKey);
    if (cachedData) {
      console.log(`[DASHBOARD STATS CACHED] ✅ Cache HIT for ${cacheKey}`);

      // Add cache headers
      res.setHeader("X-Cache", "HIT");
      res.setHeader("X-Cache-Source", cacheManager.redisClient ? "Redis" : "Memory");
      res.setHeader("Cache-Control", `public, max-age=${CACHE_CONFIG.STATS_TTL / 1000}`);

      return res.json({
        success: true,
        data: cachedData.data,
        cached: true,
        cacheSource: cacheManager.redisClient ? "Redis" : "Memory",
        cacheStats: cacheManager.getStats()
      });
    }

    console.log(`[DASHBOARD STATS CACHED] ❌ Cache MISS for ${cacheKey}`);
  } else {
    console.log(`[DASHBOARD STATS CACHED] 🔄 Force refresh requested`);
  }

  try {
    console.log("[DASHBOARD STATS CACHED] Cache miss - generating fresh data...");
    const startTime = Date.now();
    
    await connectToDatabase();

    if (mongoose.connection.readyState !== 1) {
      console.log("[DASHBOARD STATS CACHED] Database not connected");
      return res.status(500).json({
        success: false,
        message: "Database connection not available",
      });
    }

    const db = mongoose.connection.db;

    // Date calculations for time-based metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Execute optimized aggregations for key metrics only (faster cache refresh)
    const [
      // Core user metrics
      totalUsers,
      usersByType,
      newUsersThisWeek,
      activeUsersThisWeek,

      // Core story metrics
      totalStories,
      storiesByCategory,
      newStoriesThisWeek,

      // Core reading activity
      readsThisWeek,
      readsThisMonth,
      topReadsThisWeek,

      // Core engagement
      totalComments,
      totalLikes,
      commentsThisWeek,
      likesThisWeek,

      // Login activity
      loginsThisWeek,
      loginSuccessRate,

      // Trending content
      trendingStories

    ] = await Promise.all([

      // User metrics (4 queries)
      db.collection("users").countDocuments({ active: true }),
      
      db.collection("users").aggregate([
        { $match: { active: true } },
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]).toArray(),

      db.collection("users").countDocuments({
        active: true,
        createdAt: { $gte: oneWeekAgo }
      }),

      db.collection("loginlogs").aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo }, success: true } },
        { $group: { _id: "$userId" } },
        { $count: "activeUsers" }
      ]).toArray(),

      // Story metrics (3 queries)
      db.collection("stories").countDocuments({ published: true }),

      db.collection("stories").aggregate([
        { $match: { published: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),

      db.collection("stories").countDocuments({
        published: true,
        createdAt: { $gte: oneWeekAgo }
      }),

      // Reading activity (3 queries)
      db.collection("userstoryreads").countDocuments({
        timestamp: { $gte: oneWeekAgo }
      }),

      db.collection("userstoryreads").countDocuments({
        timestamp: { $gte: oneMonthAgo }
      }),

      db.collection("userstoryreads").aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        { $group: { 
          _id: "$storyId", 
          title: { $first: "$storyTitle" },
          readCount: { $sum: 1 } 
        }},
        { $sort: { readCount: -1 } },
        { $limit: 5 }
      ]).toArray(),

      // Engagement (4 queries)
      db.collection("comments").countDocuments({}),
      db.collection("likes").countDocuments({}),

      db.collection("comments").countDocuments({
        createdAt: { $gte: oneWeekAgo }
      }),

      db.collection("likes").countDocuments({
        createdAt: { $gte: oneWeekAgo }
      }),

      // Activity (2 queries)
      db.collection("loginlogs").countDocuments({
        timestamp: { $gte: oneWeekAgo }
      }),

      db.collection("loginlogs").aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } } },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: ["$success", 1, 0] } }
        }},
        { $project: {
          successRate: { $multiply: [{ $divide: ["$successful", "$total"] }, 100] }
        }}
      ]).toArray(),

      // Trending (1 query)
      db.collection("stories").aggregate([
        { $match: { published: true } },
        { $addFields: { 
          trendingScore: { 
            $add: [
              { $ifNull: ["$views", 0] },
              { $multiply: [{ $ifNull: ["$likeCount", 0] }, 2] },
              { $multiply: [{ $ifNull: ["$commentCount", 0] }, 3] }
            ]
          }
        }},
        { $sort: { trendingScore: -1 } },
        { $limit: 5 },
        { $project: { storyId: 1, title: 1, category: 1, trendingScore: 1 } }
      ]).toArray()

    ]);

    const queryTime = Date.now() - startTime;

    // Structure optimized dashboard data
    const dashboardData = {
      // Key user metrics
      users: {
        total: totalUsers,
        byType: usersByType.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        newThisWeek: newUsersThisWeek,
        activeThisWeek: activeUsersThisWeek[0]?.activeUsers || 0
      },

      // Key story metrics
      stories: {
        total: totalStories,
        topCategories: storiesByCategory.slice(0, 5),
        newThisWeek: newStoriesThisWeek
      },

      // Reading activity
      reading: {
        readsThisWeek: readsThisWeek,
        readsThisMonth: readsThisMonth,
        topReadsThisWeek: topReadsThisWeek
      },

      // Engagement summary
      engagement: {
        totalComments: totalComments,
        totalLikes: totalLikes,
        commentsThisWeek: commentsThisWeek,
        likesThisWeek: likesThisWeek,
        engagementRate: totalStories > 0 ? 
          Math.round(((totalComments + totalLikes) / totalStories) * 100) / 100 : 0
      },

      // Activity summary
      activity: {
        loginsThisWeek: loginsThisWeek,
        loginSuccessRate: Math.round((loginSuccessRate[0]?.successRate || 0) * 10) / 10
      },

      // Trending content
      trending: {
        stories: trendingStories
      },

      // Performance metadata
      metadata: {
        queryTime: `${queryTime}ms`,
        queriesExecuted: 17, // Optimized count
        generatedAt: new Date().toISOString(),
        cacheInfo: {
          ttl: `${dashboardCache.ttl / 1000}s`,
          nextRefresh: new Date(now + dashboardCache.ttl).toISOString()
        }
      }
    };

    // Update cache using cache manager
    await cacheManager.set(cacheKey, {
      data: dashboardData,
      generatedAt: new Date().toISOString()
    }, CACHE_CONFIG.STATS_TTL);

    console.log(`[DASHBOARD STATS CACHED] ✅ Fresh data generated and cached:`, {
      totalUsers: dashboardData.users.total,
      totalStories: dashboardData.stories.total,
      queryTime: `${queryTime}ms`,
      queriesOptimized: 17,
      cacheKey: cacheKey
    });

    // Add cache headers
    res.setHeader("X-Cache", "MISS");
    res.setHeader("X-Cache-Source", cacheManager.redisClient ? "Redis" : "Memory");
    res.setHeader("Cache-Control", `public, max-age=${CACHE_CONFIG.STATS_TTL / 1000}`);

    return res.json({
      success: true,
      data: dashboardData,
      cached: false,
      fresh: true,
      cacheSource: cacheManager.redisClient ? "Redis" : "Memory",
      cacheStats: cacheManager.getStats()
    });

  } catch (error) {
    console.error("[DASHBOARD STATS CACHED] Error:", error);

    // Try to return any cached data, even if potentially stale
    const staleCachedData = await cacheManager.get(cacheKey);
    if (staleCachedData) {
      console.log("[DASHBOARD STATS CACHED] Returning stale cache due to error");
      res.setHeader("X-Cache", "STALE");
      res.setHeader("X-Cache-Source", cacheManager.redisClient ? "Redis" : "Memory");
      return res.json({
        success: true,
        data: staleCachedData.data,
        cached: true,
        stale: true,
        error: "Fresh data unavailable, using cached data"
      });
    }
    
    // Fallback response
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
      error: error.message,
      fallback: {
        users: { total: 0, newThisWeek: 0 },
        stories: { total: 43, newThisWeek: 0 },
        reading: { readsThisWeek: 0, readsThisMonth: 0 },
        engagement: { totalComments: 41, totalLikes: 270 }
      }
    });
  }
}

// Export cache management functions using the new cache manager
export const clearDashboardCache = () => {
  return cacheManager.invalidatePattern('dashboard:*');
};

export const getDashboardCacheInfo = () => {
  return cacheManager.getStats();
};
