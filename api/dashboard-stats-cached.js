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

  // Check cache validity
  const now = Date.now();
  const forceRefresh = req.query.refresh === 'true';
  
  if (!forceRefresh && dashboardCache.data && dashboardCache.timestamp && 
      (now - dashboardCache.timestamp) < dashboardCache.ttl) {
    
    const cacheAge = now - dashboardCache.timestamp;
    console.log(`[DASHBOARD STATS CACHED] ✅ Returning cached data (${Math.round(cacheAge / 1000)}s old)`);
    
    // Add cache headers
    res.setHeader("X-Cache", "HIT");
    res.setHeader("X-Cache-Age", Math.round(cacheAge / 1000));
    res.setHeader("Cache-Control", `public, max-age=${Math.round((dashboardCache.ttl - cacheAge) / 1000)}`);
    
    return res.json({
      success: true,
      data: dashboardCache.data,
      cached: true,
      cacheAge: `${Math.round(cacheAge / 1000)}s`
    });
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

    // Update cache
    dashboardCache = {
      data: dashboardData,
      timestamp: now,
      ttl: dashboardCache.ttl
    };

    console.log(`[DASHBOARD STATS CACHED] ✅ Fresh data generated and cached:`, {
      totalUsers: dashboardData.users.total,
      totalStories: dashboardData.stories.total,
      queryTime: `${queryTime}ms`,
      queriesOptimized: 17
    });

    // Add cache headers
    res.setHeader("X-Cache", "MISS");
    res.setHeader("Cache-Control", `public, max-age=${dashboardCache.ttl / 1000}`);

    return res.json({
      success: true,
      data: dashboardData,
      cached: false,
      fresh: true
    });

  } catch (error) {
    console.error("[DASHBOARD STATS CACHED] Error:", error);
    
    // Return cached data if available, even if stale
    if (dashboardCache.data) {
      console.log("[DASHBOARD STATS CACHED] Returning stale cache due to error");
      res.setHeader("X-Cache", "STALE");
      return res.json({
        success: true,
        data: dashboardCache.data,
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

// Export cache management functions
export const clearDashboardCache = () => {
  dashboardCache = { data: null, timestamp: null, ttl: dashboardCache.ttl };
  console.log("[DASHBOARD STATS CACHED] Cache manually cleared");
};

export const getDashboardCacheInfo = () => {
  return {
    hasData: !!dashboardCache.data,
    age: dashboardCache.timestamp ? Date.now() - dashboardCache.timestamp : null,
    ttl: dashboardCache.ttl,
    isValid: dashboardCache.data && dashboardCache.timestamp && 
             (Date.now() - dashboardCache.timestamp) < dashboardCache.ttl
  };
};
