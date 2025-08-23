// Statistics Query Performance Testing Script
import { connectToDatabase } from "../../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[STATS PERFORMANCE] ${req.method} /api/admin/test-statistics-performance`);

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
      return res.status(500).json({
        success: false,
        message: "Database connection not available"
      });
    }

    const db = mongoose.connection.db;
    console.log("[STATS PERFORMANCE] Starting statistics query performance test...");

    // Define test queries that represent common statistics operations
    const testQueries = [
      {
        name: "Active Users Count",
        collection: "users",
        operation: async () => {
          return await db.collection("users").countDocuments({ active: true });
        }
      },
      {
        name: "Users Registered This Week",
        collection: "users", 
        operation: async () => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return await db.collection("users").countDocuments({
            active: true,
            createdAt: { $gte: oneWeekAgo }
          });
        }
      },
      {
        name: "Users by Type Distribution",
        collection: "users",
        operation: async () => {
          return await db.collection("users").aggregate([
            { $match: { active: true } },
            { $group: { _id: "$type", count: { $sum: 1 } } }
          ]).toArray();
        }
      },
      {
        name: "Published Stories Count", 
        collection: "stories",
        operation: async () => {
          return await db.collection("stories").countDocuments({ published: true });
        }
      },
      {
        name: "Published Stories with Date Sort",
        collection: "stories",
        operation: async () => {
          return await db.collection("stories")
            .find({ published: true }, { projection: { storyId: 1, title: 1, createdAt: 1 } })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();
        }
      },
      {
        name: "Stories Published This Week",
        collection: "stories",
        operation: async () => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return await db.collection("stories").countDocuments({
            published: true,
            createdAt: { $gte: oneWeekAgo }
          });
        }
      },
      {
        name: "Stories by Category",
        collection: "stories",
        operation: async () => {
          return await db.collection("stories").aggregate([
            { $match: { published: true } },
            { $group: { _id: "$category", count: { $sum: 1 } } }
          ]).toArray();
        }
      },
      {
        name: "Stories by Access Level",
        collection: "stories", 
        operation: async () => {
          return await db.collection("stories").aggregate([
            { $match: { published: true } },
            { $group: { _id: "$accessLevel", count: { $sum: 1 } } }
          ]).toArray();
        }
      },
      {
        name: "Comments This Week",
        collection: "comments",
        operation: async () => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return await db.collection("comments").countDocuments({
            createdAt: { $gte: oneWeekAgo }
          });
        }
      },
      {
        name: "Most Commented Stories",
        collection: "comments",
        operation: async () => {
          return await db.collection("comments").aggregate([
            { $group: { _id: "$storyId", commentCount: { $sum: 1 } } },
            { $sort: { commentCount: -1 } },
            { $limit: 10 }
          ]).toArray();
        }
      },
      {
        name: "Likes This Week",
        collection: "likes", 
        operation: async () => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return await db.collection("likes").countDocuments({
            createdAt: { $gte: oneWeekAgo }
          });
        }
      },
      {
        name: "Most Liked Stories",
        collection: "likes",
        operation: async () => {
          return await db.collection("likes").aggregate([
            { $group: { _id: "$storyId", likeCount: { $sum: 1 } } },
            { $sort: { likeCount: -1 } },
            { $limit: 10 }
          ]).toArray();
        }
      },
      {
        name: "Successful Logins This Week",
        collection: "loginlogs",
        operation: async () => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return await db.collection("loginlogs").countDocuments({
            timestamp: { $gte: oneWeekAgo },
            success: true
          });
        }
      },
      {
        name: "Login Success Rate",
        collection: "loginlogs",
        operation: async () => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return await db.collection("loginlogs").aggregate([
            { $match: { timestamp: { $gte: oneWeekAgo } } },
            { $group: { _id: "$success", count: { $sum: 1 } } }
          ]).toArray();
        }
      },
      {
        name: "Stories Read This Week", 
        collection: "userstoryreads",
        operation: async () => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return await db.collection("userstoryreads").countDocuments({
            timestamp: { $gte: oneWeekAgo }
          });
        }
      },
      {
        name: "Most Read Stories This Week",
        collection: "userstoryreads",
        operation: async () => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return await db.collection("userstoryreads").aggregate([
            { $match: { timestamp: { $gte: oneWeekAgo } } },
            { $group: { _id: "$storyId", readCount: { $sum: 1 } } },
            { $sort: { readCount: -1 } },
            { $limit: 10 }
          ]).toArray();
        }
      }
    ];

    const results = [];
    let totalTime = 0;

    // Run each test query and measure performance
    for (const test of testQueries) {
      try {
        console.log(`[STATS PERFORMANCE] Testing: ${test.name}...`);
        
        const startTime = Date.now();
        const result = await test.operation();
        const executionTime = Date.now() - startTime;
        
        totalTime += executionTime;

        results.push({
          name: test.name,
          collection: test.collection,
          executionTime: executionTime,
          resultCount: Array.isArray(result) ? result.length : (typeof result === 'number' ? result : 1),
          status: 'success'
        });

        console.log(`[STATS PERFORMANCE] ✅ ${test.name}: ${executionTime}ms`);

      } catch (queryError) {
        console.log(`[STATS PERFORMANCE] ❌ ${test.name} failed:`, queryError.message);
        results.push({
          name: test.name,
          collection: test.collection,
          executionTime: 0,
          resultCount: 0,
          status: 'error',
          error: queryError.message
        });
      }
    }

    // Calculate performance statistics
    const successfulQueries = results.filter(r => r.status === 'success');
    const averageExecutionTime = successfulQueries.length > 0 
      ? totalTime / successfulQueries.length 
      : 0;

    const performanceAnalysis = {
      totalQueries: testQueries.length,
      successfulQueries: successfulQueries.length,
      failedQueries: results.filter(r => r.status === 'error').length,
      totalExecutionTime: totalTime,
      averageExecutionTime: Math.round(averageExecutionTime),
      performance: categorizePerformance(averageExecutionTime)
    };

    // Group results by collection for better analysis
    const resultsByCollection = {};
    results.forEach(result => {
      if (!resultsByCollection[result.collection]) {
        resultsByCollection[result.collection] = [];
      }
      resultsByCollection[result.collection].push(result);
    });

    console.log(`[STATS PERFORMANCE] ✅ Performance test complete: ${performanceAnalysis.totalExecutionTime}ms total`);

    return res.status(200).json({
      success: true,
      message: "Statistics query performance test completed",
      summary: performanceAnalysis,
      detailedResults: results,
      resultsByCollection: resultsByCollection,
      timestamp: new Date().toISOString(),
      recommendations: generatePerformanceRecommendations(results, performanceAnalysis)
    });

  } catch (error) {
    console.error("[STATS PERFORMANCE] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to run statistics performance test",
      error: error.message
    });
  }
}

function categorizePerformance(avgTime) {
  if (avgTime < 10) return 'excellent';
  if (avgTime < 50) return 'good';
  if (avgTime < 200) return 'acceptable';
  if (avgTime < 500) return 'slow';
  return 'very_slow';
}

function generatePerformanceRecommendations(results, analysis) {
  const recommendations = [];

  // Check for slow queries
  const slowQueries = results.filter(r => r.executionTime > 100);
  if (slowQueries.length > 0) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: `${slowQueries.length} queries are executing slowly (>100ms). Consider index optimization.`,
      affectedQueries: slowQueries.map(q => q.name)
    });
  }

  // Check overall performance
  if (analysis.performance === 'slow' || analysis.performance === 'very_slow') {
    recommendations.push({
      type: 'optimization',
      priority: 'high',
      message: 'Overall query performance is suboptimal. Database index optimization is strongly recommended.',
      action: 'Run POST /api/admin/optimize-database-indexes'
    });
  }

  // Check for failed queries
  if (analysis.failedQueries > 0) {
    recommendations.push({
      type: 'error',
      priority: 'high',
      message: `${analysis.failedQueries} queries failed. Check database connectivity and schema.`
    });
  }

  // Collection-specific recommendations
  const collectionTimes = {};
  results.forEach(result => {
    if (result.status === 'success') {
      if (!collectionTimes[result.collection]) {
        collectionTimes[result.collection] = { total: 0, count: 0 };
      }
      collectionTimes[result.collection].total += result.executionTime;
      collectionTimes[result.collection].count += 1;
    }
  });

  Object.entries(collectionTimes).forEach(([collection, data]) => {
    const avgTime = data.total / data.count;
    if (avgTime > 200) {
      recommendations.push({
        type: 'collection_optimization',
        priority: 'medium',
        message: `${collection} collection queries are slow (avg: ${Math.round(avgTime)}ms). Check indexes.`,
        collection: collection
      });
    }
  });

  return recommendations;
}
