// Database Index Optimization for Statistics Queries
import { connectToDatabase } from "../../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[OPTIMIZE INDEXES] ${req.method} /api/admin/optimize-database-indexes`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: "Database connection not available"
      });
    }

    const db = mongoose.connection.db;
    const indexResults = [];

    console.log("[OPTIMIZE INDEXES] Starting database index optimization...");

    // === USER COLLECTION INDEXES ===
    console.log("[OPTIMIZE INDEXES] Optimizing User collection indexes...");
    
    try {
      // For user registration counts and active user queries
      await db.collection("users").createIndex(
        { active: 1, createdAt: -1 },
        { background: true, name: "active_createdAt_stats" }
      );
      indexResults.push({ collection: "users", index: "active_createdAt_stats", status: "created" });

      // For time-based user analytics
      await db.collection("users").createIndex(
        { createdAt: -1 },
        { background: true, name: "createdAt_stats" }
      );
      indexResults.push({ collection: "users", index: "createdAt_stats", status: "created" });

      // For user type analytics
      await db.collection("users").createIndex(
        { type: 1, active: 1 },
        { background: true, name: "type_active_stats" }
      );
      indexResults.push({ collection: "users", index: "type_active_stats", status: "created" });

      // For country-based analytics
      await db.collection("users").createIndex(
        { country: 1, active: 1 },
        { background: true, name: "country_active_stats" }
      );
      indexResults.push({ collection: "users", index: "country_active_stats", status: "created" });

    } catch (userIndexError) {
      console.log("[OPTIMIZE INDEXES] User indexes:", userIndexError.message);
      indexResults.push({ collection: "users", error: userIndexError.message });
    }

    // === STORY COLLECTION INDEXES ===
    console.log("[OPTIMIZE INDEXES] Optimizing Story collection indexes...");
    
    try {
      // For published stories with creation date sorting (most common query)
      await db.collection("stories").createIndex(
        { published: 1, createdAt: -1 },
        { background: true, name: "published_createdAt_stats" }
      );
      indexResults.push({ collection: "stories", index: "published_createdAt_stats", status: "created" });

      // For category-based story analytics
      await db.collection("stories").createIndex(
        { published: 1, category: 1 },
        { background: true, name: "published_category_stats" }
      );
      indexResults.push({ collection: "stories", index: "published_category_stats", status: "created" });

      // For access level analytics
      await db.collection("stories").createIndex(
        { published: 1, accessLevel: 1 },
        { background: true, name: "published_accessLevel_stats" }
      );
      indexResults.push({ collection: "stories", index: "published_accessLevel_stats", status: "created" });

      // For story statistics sorting and filtering
      await db.collection("stories").createIndex(
        { published: 1, views: -1 },
        { background: true, name: "published_views_stats" }
      );
      indexResults.push({ collection: "stories", index: "published_views_stats", status: "created" });

      await db.collection("stories").createIndex(
        { published: 1, likeCount: -1 },
        { background: true, name: "published_likeCount_stats" }
      );
      indexResults.push({ collection: "stories", index: "published_likeCount_stats", status: "created" });

      await db.collection("stories").createIndex(
        { published: 1, averageRating: -1 },
        { background: true, name: "published_averageRating_stats" }
      );
      indexResults.push({ collection: "stories", index: "published_averageRating_stats", status: "created" });

    } catch (storyIndexError) {
      console.log("[OPTIMIZE INDEXES] Story indexes:", storyIndexError.message);
      indexResults.push({ collection: "stories", error: storyIndexError.message });
    }

    // === COMMENT COLLECTION INDEXES ===
    console.log("[OPTIMIZE INDEXES] Optimizing Comment collection indexes...");
    
    try {
      // For time-based comment analytics
      await db.collection("comments").createIndex(
        { createdAt: -1 },
        { background: true, name: "createdAt_stats" }
      );
      indexResults.push({ collection: "comments", index: "createdAt_stats", status: "created" });

      // For story comment counts (already has storyId, but optimize for grouping)
      await db.collection("comments").createIndex(
        { storyId: 1, createdAt: -1 },
        { background: true, name: "storyId_createdAt_stats" }
      );
      indexResults.push({ collection: "comments", index: "storyId_createdAt_stats", status: "created" });

    } catch (commentIndexError) {
      console.log("[OPTIMIZE INDEXES] Comment indexes:", commentIndexError.message);
      indexResults.push({ collection: "comments", error: commentIndexError.message });
    }

    // === LIKE COLLECTION INDEXES ===
    console.log("[OPTIMIZE INDEXES] Optimizing Like collection indexes...");
    
    try {
      // For time-based like analytics
      await db.collection("likes").createIndex(
        { createdAt: -1 },
        { background: true, name: "createdAt_stats" }
      );
      indexResults.push({ collection: "likes", index: "createdAt_stats", status: "created" });

      // For story like aggregations
      await db.collection("likes").createIndex(
        { storyId: 1 },
        { background: true, name: "storyId_stats" }
      );
      indexResults.push({ collection: "likes", index: "storyId_stats", status: "created" });

      // For story like counts with time filtering
      await db.collection("likes").createIndex(
        { storyId: 1, createdAt: -1 },
        { background: true, name: "storyId_createdAt_stats" }
      );
      indexResults.push({ collection: "likes", index: "storyId_createdAt_stats", status: "created" });

    } catch (likeIndexError) {
      console.log("[OPTIMIZE INDEXES] Like indexes:", likeIndexError.message);
      indexResults.push({ collection: "likes", error: likeIndexError.message });
    }

    // === RATING COLLECTION INDEXES ===
    console.log("[OPTIMIZE INDEXES] Optimizing Rating collection indexes...");
    
    try {
      // For time-based rating analytics
      await db.collection("ratings").createIndex(
        { createdAt: -1 },
        { background: true, name: "createdAt_stats" }
      );
      indexResults.push({ collection: "ratings", index: "createdAt_stats", status: "created" });

      // For story rating aggregations
      await db.collection("ratings").createIndex(
        { storyId: 1 },
        { background: true, name: "storyId_stats" }
      );
      indexResults.push({ collection: "ratings", index: "storyId_stats", status: "created" });

      // For story rating calculations with time filtering
      await db.collection("ratings").createIndex(
        { storyId: 1, createdAt: -1 },
        { background: true, name: "storyId_createdAt_stats" }
      );
      indexResults.push({ collection: "ratings", index: "storyId_createdAt_stats", status: "created" });

    } catch (ratingIndexError) {
      console.log("[OPTIMIZE INDEXES] Rating indexes:", ratingIndexError.message);
      indexResults.push({ collection: "ratings", error: ratingIndexError.message });
    }

    // === LOGIN LOG COLLECTION INDEXES ===
    console.log("[OPTIMIZE INDEXES] Optimizing LoginLog collection indexes...");
    
    try {
      // For login analytics with timestamp and success filtering
      await db.collection("loginlogs").createIndex(
        { timestamp: -1, success: 1 },
        { background: true, name: "timestamp_success_stats" }
      );
      indexResults.push({ collection: "loginlogs", index: "timestamp_success_stats", status: "created" });

      // For general time-based login analytics
      await db.collection("loginlogs").createIndex(
        { timestamp: -1 },
        { background: true, name: "timestamp_stats" }
      );
      indexResults.push({ collection: "loginlogs", index: "timestamp_stats", status: "created" });

      // For country-based login analytics
      await db.collection("loginlogs").createIndex(
        { country: 1, timestamp: -1 },
        { background: true, name: "country_timestamp_stats" }
      );
      indexResults.push({ collection: "loginlogs", index: "country_timestamp_stats", status: "created" });

      // For user-specific login analytics
      await db.collection("loginlogs").createIndex(
        { userId: 1, timestamp: -1 },
        { background: true, name: "userId_timestamp_stats" }
      );
      indexResults.push({ collection: "loginlogs", index: "userId_timestamp_stats", status: "created" });

    } catch (loginLogIndexError) {
      console.log("[OPTIMIZE INDEXES] LoginLog indexes:", loginLogIndexError.message);
      indexResults.push({ collection: "loginlogs", error: loginLogIndexError.message });
    }

    // === USER STORY READ COLLECTION INDEXES ===
    console.log("[OPTIMIZE INDEXES] Optimizing UserStoryRead collection indexes...");
    
    try {
      // For reading analytics by story with time filtering
      await db.collection("userstoryreads").createIndex(
        { storyId: 1, timestamp: -1 },
        { background: true, name: "storyId_timestamp_stats" }
      );
      indexResults.push({ collection: "userstoryreads", index: "storyId_timestamp_stats", status: "created" });

      // For user reading analytics
      await db.collection("userstoryreads").createIndex(
        { userId: 1, timestamp: -1 },
        { background: true, name: "userId_timestamp_stats" }
      );
      indexResults.push({ collection: "userstoryreads", index: "userId_timestamp_stats", status: "created" });

    } catch (readIndexError) {
      console.log("[OPTIMIZE INDEXES] UserStoryRead indexes:", readIndexError.message);
      indexResults.push({ collection: "userstoryreads", error: readIndexError.message });
    }

    // === ERROR LOG COLLECTION INDEXES ===
    console.log("[OPTIMIZE INDEXES] Optimizing ErrorLog collection indexes...");
    
    try {
      // For error analytics and monitoring
      await db.collection("errorlogs").createIndex(
        { timestamp: -1 },
        { background: true, name: "timestamp_stats" }
      );
      indexResults.push({ collection: "errorlogs", index: "timestamp_stats", status: "created" });

      // For endpoint-based error analytics
      await db.collection("errorlogs").createIndex(
        { endpoint: 1, timestamp: -1 },
        { background: true, name: "endpoint_timestamp_stats" }
      );
      indexResults.push({ collection: "errorlogs", index: "endpoint_timestamp_stats", status: "created" });

    } catch (errorLogIndexError) {
      console.log("[OPTIMIZE INDEXES] ErrorLog indexes:", errorLogIndexError.message);
      indexResults.push({ collection: "errorlogs", error: errorLogIndexError.message });
    }

    const successCount = indexResults.filter(r => r.status === "created").length;
    const errorCount = indexResults.filter(r => r.error).length;

    console.log(`[OPTIMIZE INDEXES] ✅ Index optimization complete: ${successCount} created, ${errorCount} errors`);

    return res.status(200).json({
      success: true,
      message: `Database indexes optimized for statistics queries`,
      summary: {
        indexesCreated: successCount,
        errors: errorCount,
        totalOperations: indexResults.length
      },
      results: indexResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[OPTIMIZE INDEXES] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to optimize database indexes",
      error: error.message
    });
  }
}
