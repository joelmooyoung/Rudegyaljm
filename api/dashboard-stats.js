import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[DASHBOARD STATS] ${req.method} /api/dashboard-stats`);

  // Enable CORS and disable caching for fresh data
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    console.log(
      "[DASHBOARD STATS] Executing comprehensive dashboard aggregations...",
    );
    const startTime = Date.now();

    await connectToDatabase();

    if (mongoose.connection.readyState !== 1) {
      console.log("[DASHBOARD STATS] Database not connected");
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
    const startOfThisWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Execute all aggregations in parallel for maximum performance
    const [
      // 1. User Statistics
      totalUsers,
      usersByType,
      usersByCountry,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersThisWeek,

      // 2. Story Statistics
      totalStories,
      storiesByCategory,
      storiesByAccessLevel,
      newStoriesThisWeek,
      newStoriesThisMonth,

      // 3. Reading Activity
      readsThisWeek,
      readsThisMonth,
      mostReadStoriesThisWeek,
      mostReadStoriesThisMonth,

      // 4. Engagement Metrics
      totalComments,
      totalLikes,
      totalRatings,
      commentsThisWeek,
      likesThisWeek,
      ratingsThisWeek,
      mostCommentedStories,
      mostLikedStories,
      topRatedStories,

      // 5. Login Activity
      loginsThisWeek,
      loginsThisMonth,
      loginsByCountry,
      loginSuccessRate,

      // 6. Trending Metrics
      trendingStories,
      popularCategoriesThisWeek,
    ] = await Promise.all([
      // === USER STATISTICS ===

      // Total users count
      db.collection("users").countDocuments({ active: true }),

      // Users by type (admin, premium, free)
      db
        .collection("users")
        .aggregate([
          { $match: { active: true } },
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ])
        .toArray(),

      // Users by country (top 10)
      db
        .collection("users")
        .aggregate([
          { $match: { active: true } },
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      // New users this week
      db.collection("users").countDocuments({
        active: true,
        createdAt: { $gte: oneWeekAgo },
      }),

      // New users this month
      db.collection("users").countDocuments({
        active: true,
        createdAt: { $gte: oneMonthAgo },
      }),

      // Active users this week (based on logins)
      db
        .collection("loginlogs")
        .aggregate([
          { $match: { timestamp: { $gte: oneWeekAgo }, success: true } },
          { $group: { _id: "$userId" } },
          { $count: "activeUsers" },
        ])
        .toArray(),

      // === STORY STATISTICS ===

      // Total published stories
      db.collection("stories").countDocuments({ published: true }),

      // Stories by category
      db
        .collection("stories")
        .aggregate([
          { $match: { published: true } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),

      // Stories by access level
      db
        .collection("stories")
        .aggregate([
          { $match: { published: true } },
          { $group: { _id: "$accessLevel", count: { $sum: 1 } } },
        ])
        .toArray(),

      // New stories this week
      db.collection("stories").countDocuments({
        published: true,
        createdAt: { $gte: oneWeekAgo },
      }),

      // New stories this month
      db.collection("stories").countDocuments({
        published: true,
        createdAt: { $gte: oneMonthAgo },
      }),

      // === READING ACTIVITY ===

      // Stories read this week
      db.collection("userstoryreads").countDocuments({
        timestamp: { $gte: oneWeekAgo },
      }),

      // Stories read this month
      db.collection("userstoryreads").countDocuments({
        timestamp: { $gte: oneMonthAgo },
      }),

      // Most read stories this week (top 10)
      db
        .collection("userstoryreads")
        .aggregate([
          { $match: { timestamp: { $gte: oneWeekAgo } } },
          {
            $group: {
              _id: "$storyId",
              title: { $first: "$storyTitle" },
              readCount: { $sum: 1 },
            },
          },
          { $sort: { readCount: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      // Most read stories this month (top 10)
      db
        .collection("userstoryreads")
        .aggregate([
          { $match: { timestamp: { $gte: oneMonthAgo } } },
          {
            $group: {
              _id: "$storyId",
              title: { $first: "$storyTitle" },
              readCount: { $sum: 1 },
            },
          },
          { $sort: { readCount: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      // === ENGAGEMENT METRICS ===

      // Total comments
      db.collection("comments").countDocuments({}),

      // Total likes
      db.collection("likes").countDocuments({}),

      // Total ratings
      db.collection("ratings").countDocuments({}),

      // Comments this week
      db.collection("comments").countDocuments({
        createdAt: { $gte: oneWeekAgo },
      }),

      // Likes this week
      db.collection("likes").countDocuments({
        createdAt: { $gte: oneWeekAgo },
      }),

      // Ratings this week
      db.collection("ratings").countDocuments({
        createdAt: { $gte: oneWeekAgo },
      }),

      // Most commented stories (top 10)
      db
        .collection("comments")
        .aggregate([
          { $group: { _id: "$storyId", commentCount: { $sum: 1 } } },
          {
            $lookup: {
              from: "stories",
              localField: "_id",
              foreignField: "storyId",
              as: "story",
            },
          },
          { $match: { "story.published": true } },
          { $addFields: { title: { $arrayElemAt: ["$story.title", 0] } } },
          { $sort: { commentCount: -1 } },
          { $limit: 10 },
          { $project: { storyId: "$_id", title: 1, commentCount: 1 } },
        ])
        .toArray(),

      // Most liked stories (top 10)
      db
        .collection("likes")
        .aggregate([
          { $group: { _id: "$storyId", likeCount: { $sum: 1 } } },
          {
            $lookup: {
              from: "stories",
              localField: "_id",
              foreignField: "storyId",
              as: "story",
            },
          },
          { $match: { "story.published": true } },
          { $addFields: { title: { $arrayElemAt: ["$story.title", 0] } } },
          { $sort: { likeCount: -1 } },
          { $limit: 10 },
          { $project: { storyId: "$_id", title: 1, likeCount: 1 } },
        ])
        .toArray(),

      // Top rated stories (average rating, min 5 ratings)
      db
        .collection("ratings")
        .aggregate([
          {
            $group: {
              _id: "$storyId",
              avgRating: { $avg: "$rating" },
              ratingCount: { $sum: 1 },
            },
          },
          { $match: { ratingCount: { $gte: 5 } } },
          {
            $lookup: {
              from: "stories",
              localField: "_id",
              foreignField: "storyId",
              as: "story",
            },
          },
          { $match: { "story.published": true } },
          { $addFields: { title: { $arrayElemAt: ["$story.title", 0] } } },
          { $sort: { avgRating: -1 } },
          { $limit: 10 },
          {
            $project: {
              storyId: "$_id",
              title: 1,
              avgRating: { $round: ["$avgRating", 1] },
              ratingCount: 1,
            },
          },
        ])
        .toArray(),

      // === LOGIN ACTIVITY ===

      // Logins this week
      db.collection("loginlogs").countDocuments({
        timestamp: { $gte: oneWeekAgo },
      }),

      // Logins this month
      db.collection("loginlogs").countDocuments({
        timestamp: { $gte: oneMonthAgo },
      }),

      // Logins by country (this month, top 10)
      db
        .collection("loginlogs")
        .aggregate([
          { $match: { timestamp: { $gte: oneMonthAgo } } },
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      // Login success rate (this month)
      db
        .collection("loginlogs")
        .aggregate([
          { $match: { timestamp: { $gte: oneMonthAgo } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              successful: { $sum: { $cond: ["$success", 1, 0] } },
            },
          },
          {
            $project: {
              total: 1,
              successful: 1,
              successRate: {
                $multiply: [{ $divide: ["$successful", "$total"] }, 100],
              },
            },
          },
        ])
        .toArray(),

      // === TRENDING METRICS ===

      // Trending stories (high recent activity)
      db
        .collection("stories")
        .aggregate([
          { $match: { published: true } },
          {
            $lookup: {
              from: "userstoryreads",
              let: { storyId: "$storyId" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$storyId", "$$storyId"] },
                    timestamp: { $gte: oneWeekAgo },
                  },
                },
                { $count: "recentReads" },
              ],
              as: "recentActivity",
            },
          },
          {
            $addFields: {
              recentReads: { $arrayElemAt: ["$recentActivity.recentReads", 0] },
            },
          },
          { $match: { recentReads: { $gt: 0 } } },
          { $sort: { recentReads: -1 } },
          { $limit: 10 },
          {
            $project: {
              storyId: 1,
              title: 1,
              category: 1,
              views: 1,
              recentReads: 1,
            },
          },
        ])
        .toArray(),

      // Popular categories this week (by read activity)
      db
        .collection("userstoryreads")
        .aggregate([
          { $match: { timestamp: { $gte: oneWeekAgo } } },
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
            $addFields: { category: { $arrayElemAt: ["$story.category", 0] } },
          },
          { $group: { _id: "$category", readCount: { $sum: 1 } } },
          { $sort: { readCount: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
    ]);

    const queryTime = Date.now() - startTime;
    console.log(
      `[DASHBOARD STATS] All aggregations completed in ${queryTime}ms`,
    );

    // Process and structure the results
    const dashboardStats = {
      // User Metrics
      users: {
        total: totalUsers,
        byType: usersByType.reduce((acc, item) => {
          acc[item._id || "unknown"] = item.count;
          return acc;
        }, {}),
        byCountry: usersByCountry,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        activeThisWeek: activeUsersThisWeek[0]?.activeUsers || 0,
      },

      // Story Metrics
      stories: {
        total: totalStories,
        byCategory: storiesByCategory,
        byAccessLevel: storiesByAccessLevel.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        newThisWeek: newStoriesThisWeek,
        newThisMonth: newStoriesThisMonth,
      },

      // Reading Activity
      reading: {
        readsThisWeek: readsThisWeek,
        readsThisMonth: readsThisMonth,
        mostReadThisWeek: mostReadStoriesThisWeek,
        mostReadThisMonth: mostReadStoriesThisMonth,
      },

      // Engagement Metrics
      engagement: {
        totals: {
          comments: totalComments,
          likes: totalLikes,
          ratings: totalRatings,
        },
        thisWeek: {
          comments: commentsThisWeek,
          likes: likesThisWeek,
          ratings: ratingsThisWeek,
        },
        topStories: {
          mostCommented: mostCommentedStories,
          mostLiked: mostLikedStories,
          topRated: topRatedStories,
        },
      },

      // Login Activity
      activity: {
        logins: {
          thisWeek: loginsThisWeek,
          thisMonth: loginsThisMonth,
          byCountry: loginsByCountry,
          successRate: loginSuccessRate[0]?.successRate || 0,
        },
      },

      // Trending Metrics
      trending: {
        stories: trendingStories,
        categories: popularCategoriesThisWeek,
      },

      // Performance Metadata
      metadata: {
        queryTime: `${queryTime}ms`,
        aggregationsExecuted: 30,
        generatedAt: new Date().toISOString(),
        timeRanges: {
          oneWeekAgo: oneWeekAgo.toISOString(),
          oneMonthAgo: oneMonthAgo.toISOString(),
        },
      },
    };

    console.log(
      `[DASHBOARD STATS] ✅ Comprehensive dashboard data generated:`,
      {
        totalUsers: dashboardStats.users.total,
        totalStories: dashboardStats.stories.total,
        readsThisWeek: dashboardStats.reading.readsThisWeek,
        queryTime: `${queryTime}ms`,
      },
    );

    return res.json({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    console.error("[DASHBOARD STATS] Error:", error);

    // Provide fallback response with basic stats
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
      error: error.message,
      fallback: {
        users: { total: 0, newThisWeek: 0 },
        stories: { total: 43, newThisWeek: 0 },
        reading: { readsThisWeek: 0, readsThisMonth: 0 },
        engagement: { totals: { comments: 41, likes: 270, ratings: 1314 } },
      },
    });
  }
}
