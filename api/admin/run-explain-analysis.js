// Practical EXPLAIN Analysis Runner for Current Statistics Queries
import { connectToDatabase } from "../../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[RUN EXPLAIN] ${req.method} /api/admin/run-explain-analysis`);

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
        message: "Database connection not available",
      });
    }

    const db = mongoose.connection.db;
    const { queryType = "all", includeExamples = false } = req.query;

    console.log(`[RUN EXPLAIN] Running EXPLAIN analysis for: ${queryType}`);

    // Date calculations used in actual queries
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const explainResults = {};

    // === USER COLLECTION ANALYSIS ===
    if (queryType === "all" || queryType === "users") {
      console.log("[RUN EXPLAIN] Analyzing User collection queries...");

      try {
        // Query 1: Active users count (used in dashboard)
        const activeUsersExplain = await db
          .collection("users")
          .find({ active: true })
          .explain("executionStats");

        // Query 2: Users by type (dashboard aggregation)
        const usersByTypeExplain = await db
          .collection("users")
          .aggregate([
            { $match: { active: true } },
            { $group: { _id: "$type", count: { $sum: 1 } } },
          ])
          .explain("executionStats");

        // Query 3: New users this week (time-based query)
        const newUsersWeekExplain = await db
          .collection("users")
          .find({
            active: true,
            createdAt: { $gte: oneWeekAgo },
          })
          .explain("executionStats");

        // Query 4: All users with sorting (user management page)
        const allUsersSortedExplain = await db
          .collection("users")
          .find({}, { projection: { password: 0, __v: 0 } })
          .sort({ createdAt: -1 })
          .explain("executionStats");

        explainResults.users = {
          activeUsersCount: analyzeExplainResult(
            activeUsersExplain,
            "Active Users Count",
          ),
          usersByType: analyzeExplainResult(
            usersByTypeExplain,
            "Users by Type Aggregation",
          ),
          newUsersThisWeek: analyzeExplainResult(
            newUsersWeekExplain,
            "New Users This Week",
          ),
          allUsersSorted: analyzeExplainResult(
            allUsersSortedExplain,
            "All Users Sorted",
          ),
        };
      } catch (userError) {
        explainResults.users = { error: userError.message };
      }
    }

    // === STORY COLLECTION ANALYSIS ===
    if (queryType === "all" || queryType === "stories") {
      console.log("[RUN EXPLAIN] Analyzing Story collection queries...");

      try {
        // Query 1: Published stories count
        const publishedCountExplain = await db
          .collection("stories")
          .find({ published: true })
          .explain("executionStats");

        // Query 2: Published stories with sorting and pagination (landing page)
        const publishedSortedExplain = await db
          .collection("stories")
          .find(
            { published: true },
            {
              projection: {
                storyId: 1,
                title: 1,
                author: 1,
                category: 1,
                accessLevel: 1,
                createdAt: 1,
                viewCount: 1,
                views: 1,
              },
            },
          )
          .sort({ createdAt: -1 })
          .limit(8)
          .explain("executionStats");

        // Query 3: Stories by category aggregation
        const storiesByCategoryExplain = await db
          .collection("stories")
          .aggregate([
            { $match: { published: true } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
          ])
          .explain("executionStats");

        // Query 4: Story statistics aggregation (dashboard)
        const storyStatsExplain = await db
          .collection("stories")
          .aggregate([
            { $match: { published: true } },
            {
              $group: {
                _id: null,
                totalLikes: { $sum: { $ifNull: ["$likeCount", 0] } },
                totalViews: {
                  $sum: {
                    $max: [
                      { $ifNull: ["$viewCount", 0] },
                      { $ifNull: ["$views", 0] },
                    ],
                  },
                },
                totalRatings: { $sum: { $ifNull: ["$ratingCount", 0] } },
              },
            },
          ])
          .explain("executionStats");

        explainResults.stories = {
          publishedCount: analyzeExplainResult(
            publishedCountExplain,
            "Published Stories Count",
          ),
          publishedSorted: analyzeExplainResult(
            publishedSortedExplain,
            "Published Stories Sorted",
          ),
          storiesByCategory: analyzeExplainResult(
            storiesByCategoryExplain,
            "Stories by Category",
          ),
          storyStats: analyzeExplainResult(
            storyStatsExplain,
            "Story Statistics Aggregation",
          ),
        };
      } catch (storyError) {
        explainResults.stories = { error: storyError.message };
      }
    }

    // === COMMENT COLLECTION ANALYSIS ===
    if (queryType === "all" || queryType === "comments") {
      console.log("[RUN EXPLAIN] Analyzing Comment collection queries...");

      try {
        // Query 1: Comments this week
        const commentsWeekExplain = await db
          .collection("comments")
          .find({ createdAt: { $gte: oneWeekAgo } })
          .explain("executionStats");

        // Query 2: Most commented stories
        const mostCommentedExplain = await db
          .collection("comments")
          .aggregate([
            { $group: { _id: "$storyId", commentCount: { $sum: 1 } } },
            { $sort: { commentCount: -1 } },
            { $limit: 10 },
          ])
          .explain("executionStats");

        // Query 3: Comments by story IDs (N+1 pattern check)
        const sampleStoryIds = await db
          .collection("stories")
          .find({ published: true }, { projection: { storyId: 1 } })
          .limit(5)
          .toArray();

        const storyIds = sampleStoryIds.map((s) => s.storyId);

        const commentsByStoriesExplain = await db
          .collection("comments")
          .aggregate([
            { $match: { storyId: { $in: storyIds } } },
            { $group: { _id: "$storyId", count: { $sum: 1 } } },
          ])
          .explain("executionStats");

        explainResults.comments = {
          commentsThisWeek: analyzeExplainResult(
            commentsWeekExplain,
            "Comments This Week",
          ),
          mostCommented: analyzeExplainResult(
            mostCommentedExplain,
            "Most Commented Stories",
          ),
          commentsByStories: analyzeExplainResult(
            commentsByStoriesExplain,
            "Comments by Story IDs",
          ),
        };
      } catch (commentError) {
        explainResults.comments = { error: commentError.message };
      }
    }

    // === LOGIN LOG ANALYSIS ===
    if (queryType === "all" || queryType === "loginlogs") {
      console.log("[RUN EXPLAIN] Analyzing LoginLog collection queries...");

      try {
        // Query 1: Successful logins this week
        const successfulLoginsExplain = await db
          .collection("loginlogs")
          .find({
            timestamp: { $gte: oneWeekAgo },
            success: true,
          })
          .explain("executionStats");

        // Query 2: Login success rate analysis
        const loginSuccessRateExplain = await db
          .collection("loginlogs")
          .aggregate([
            { $match: { timestamp: { $gte: oneMonthAgo } } },
            { $group: { _id: "$success", count: { $sum: 1 } } },
          ])
          .explain("executionStats");

        explainResults.loginlogs = {
          successfulLogins: analyzeExplainResult(
            successfulLoginsExplain,
            "Successful Logins This Week",
          ),
          loginSuccessRate: analyzeExplainResult(
            loginSuccessRateExplain,
            "Login Success Rate Analysis",
          ),
        };
      } catch (loginError) {
        explainResults.loginlogs = { error: loginError.message };
      }
    }

    // === USER STORY READS ANALYSIS ===
    if (queryType === "all" || queryType === "userstoryreads") {
      console.log(
        "[RUN EXPLAIN] Analyzing UserStoryRead collection queries...",
      );

      try {
        // Query 1: Reads this week
        const readsWeekExplain = await db
          .collection("userstoryreads")
          .find({ timestamp: { $gte: oneWeekAgo } })
          .explain("executionStats");

        // Query 2: Most read stories this week
        const mostReadExplain = await db
          .collection("userstoryreads")
          .aggregate([
            { $match: { timestamp: { $gte: oneWeekAgo } } },
            { $group: { _id: "$storyId", readCount: { $sum: 1 } } },
            { $sort: { readCount: -1 } },
            { $limit: 10 },
          ])
          .explain("executionStats");

        explainResults.userstoryreads = {
          readsThisWeek: analyzeExplainResult(
            readsWeekExplain,
            "Reads This Week",
          ),
          mostRead: analyzeExplainResult(
            mostReadExplain,
            "Most Read Stories This Week",
          ),
        };
      } catch (readError) {
        explainResults.userstoryreads = { error: readError.message };
      }
    }

    // Generate comprehensive analysis
    const overallAnalysis = generateOverallAnalysis(explainResults);
    const criticalIssues = identifyCriticalIssues(explainResults);
    const recommendations = generatePracticalRecommendations(explainResults);

    console.log(`[RUN EXPLAIN] ✅ EXPLAIN analysis complete`);

    return res.status(200).json({
      success: true,
      summary: {
        collectionsAnalyzed: Object.keys(explainResults).length,
        totalQueries: getTotalQueriesCount(explainResults),
        criticalIssues: criticalIssues.length,
        recommendedIndexes: recommendations.filter((r) => r.type === "index")
          .length,
      },
      explainResults,
      overallAnalysis,
      criticalIssues,
      recommendations,
      nextSteps: generateNextSteps(criticalIssues),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[RUN EXPLAIN] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to run EXPLAIN analysis",
      error: error.message,
    });
  }
}

function analyzeExplainResult(explainResult, queryName) {
  const analysis = {
    queryName,
    executionStats: {},
    performance: "unknown",
    issues: [],
    indexesUsed: [],
    recommendations: [],
  };

  try {
    let stats;

    // Handle different explain result formats
    if (explainResult.executionStats) {
      stats = explainResult.executionStats;
    } else if (explainResult.stages && explainResult.stages.length > 0) {
      // Aggregation pipeline
      const firstStage = explainResult.stages[0];
      if (firstStage.$cursor && firstStage.$cursor.executionStats) {
        stats = firstStage.$cursor.executionStats;
      }
    }

    if (stats) {
      analysis.executionStats = {
        totalDocsExamined: stats.totalDocsExamined || 0,
        totalDocsReturned: stats.totalDocsReturned || 0,
        executionTimeMillis: stats.executionTimeMillisEstimate || 0,
        totalKeysExamined: stats.totalKeysExamined || 0,
        indexHit: (stats.totalKeysExamined || 0) > 0,
      };

      // Analyze execution stages
      if (stats.executionStages) {
        const stage = stats.executionStages;

        if (stage.stage === "COLLSCAN") {
          analysis.issues.push({
            type: "full_collection_scan",
            severity: "critical",
            message:
              "Query is performing a full collection scan - requires index",
            impact: "High CPU usage and slow response times",
          });
          analysis.performance = "critical";
        } else if (stage.stage === "IXSCAN") {
          analysis.indexesUsed.push(stage.indexName || "unknown");
          analysis.performance = "good";

          // Check index efficiency
          const efficiency =
            analysis.executionStats.totalDocsReturned /
            Math.max(analysis.executionStats.totalDocsExamined, 1);
          if (efficiency < 0.1) {
            analysis.issues.push({
              type: "inefficient_index",
              severity: "medium",
              message: `Index scan efficiency: ${(efficiency * 100).toFixed(1)}% - consider more selective index`,
              impact: "Moderate performance impact",
            });
          }
        }
      }

      // Performance categorization
      if (analysis.executionStats.executionTimeMillis > 100) {
        analysis.issues.push({
          type: "slow_execution",
          severity:
            analysis.executionStats.executionTimeMillis > 1000
              ? "high"
              : "medium",
          message: `Query execution time: ${analysis.executionStats.executionTimeMillis}ms`,
          impact: "User experience degradation",
        });
      }

      // Document examination ratio
      if (
        analysis.executionStats.totalDocsExamined >
        analysis.executionStats.totalDocsReturned * 10
      ) {
        analysis.issues.push({
          type: "excessive_scanning",
          severity: "medium",
          message: `Examining ${analysis.executionStats.totalDocsExamined} docs to return ${analysis.executionStats.totalDocsReturned}`,
          impact: "Inefficient resource usage",
        });
      }
    }

    // Generate specific recommendations
    if (analysis.issues.length > 0) {
      analysis.recommendations = generateQueryRecommendations(
        queryName,
        analysis.issues,
      );
    }
  } catch (analysisError) {
    analysis.issues.push({
      type: "analysis_error",
      severity: "low",
      message: `Could not analyze explain result: ${analysisError.message}`,
    });
  }

  return analysis;
}

function generateQueryRecommendations(queryName, issues) {
  const recommendations = [];

  issues.forEach((issue) => {
    switch (issue.type) {
      case "full_collection_scan":
        if (queryName.includes("Active Users")) {
          recommendations.push("Create index: { active: 1 }");
        } else if (queryName.includes("Published Stories")) {
          recommendations.push("Create index: { published: 1, createdAt: -1 }");
        } else if (queryName.includes("Week") || queryName.includes("Month")) {
          recommendations.push(
            "Create index on date field: { createdAt: -1 } or { timestamp: -1 }",
          );
        }
        break;

      case "inefficient_index":
        recommendations.push(
          "Consider compound index with more selective fields first",
        );
        break;

      case "slow_execution":
        recommendations.push(
          "Add appropriate indexes and consider query optimization",
        );
        break;

      case "excessive_scanning":
        recommendations.push(
          "Create covering index or more selective compound index",
        );
        break;
    }
  });

  return recommendations;
}

function generateOverallAnalysis(explainResults) {
  let totalQueries = 0;
  let queriesWithIssues = 0;
  let criticalQueries = 0;
  const collectionIssues = {};

  Object.entries(explainResults).forEach(([collection, queries]) => {
    if (queries.error) return;

    collectionIssues[collection] = { total: 0, issues: 0, critical: 0 };

    Object.values(queries).forEach((query) => {
      if (query.queryName) {
        totalQueries++;
        collectionIssues[collection].total++;

        if (query.issues.length > 0) {
          queriesWithIssues++;
          collectionIssues[collection].issues++;

          if (query.issues.some((i) => i.severity === "critical")) {
            criticalQueries++;
            collectionIssues[collection].critical++;
          }
        }
      }
    });
  });

  return {
    totalQueries,
    queriesWithIssues,
    criticalQueries,
    healthScore: Math.round(
      ((totalQueries - criticalQueries) / totalQueries) * 100,
    ),
    collectionIssues,
  };
}

function identifyCriticalIssues(explainResults) {
  const criticalIssues = [];

  Object.entries(explainResults).forEach(([collection, queries]) => {
    if (queries.error) return;

    Object.values(queries).forEach((query) => {
      if (query.issues) {
        query.issues.forEach((issue) => {
          if (issue.severity === "critical") {
            criticalIssues.push({
              collection,
              queryName: query.queryName,
              issue,
              recommendations: query.recommendations,
            });
          }
        });
      }
    });
  });

  return criticalIssues;
}

function generatePracticalRecommendations(explainResults) {
  const recommendations = [];

  // Check for missing indexes on active field
  if (explainResults.users) {
    const activeUsersQuery = explainResults.users.activeUsersCount;
    if (
      activeUsersQuery &&
      activeUsersQuery.issues.some((i) => i.type === "full_collection_scan")
    ) {
      recommendations.push({
        type: "index",
        priority: "high",
        collection: "users",
        index: "{ active: 1 }",
        reason: "Active users filtering requires index for performance",
        queries: ["Active Users Count", "Users by Type"],
      });
    }
  }

  // Check for missing indexes on published field
  if (explainResults.stories) {
    const publishedQuery = explainResults.stories.publishedCount;
    if (
      publishedQuery &&
      publishedQuery.issues.some((i) => i.type === "full_collection_scan")
    ) {
      recommendations.push({
        type: "index",
        priority: "critical",
        collection: "stories",
        index: "{ published: 1, createdAt: -1 }",
        reason:
          "Published stories with sorting is the most common query pattern",
        queries: [
          "Published Stories Count",
          "Published Stories Sorted",
          "Story Statistics",
        ],
      });
    }
  }

  // Check for time-based query optimization
  const timeBasedCollections = ["comments", "loginlogs", "userstoryreads"];
  timeBasedCollections.forEach((collection) => {
    if (explainResults[collection]) {
      const hasTimeIssues = Object.values(explainResults[collection]).some(
        (query) =>
          query.issues &&
          query.issues.some((i) => i.type === "full_collection_scan"),
      );

      if (hasTimeIssues) {
        const timeField =
          collection === "loginlogs" ? "timestamp" : "createdAt";
        recommendations.push({
          type: "index",
          priority: "high",
          collection,
          index: `{ ${timeField}: -1 }`,
          reason: "Time-based analytics require date field indexing",
          queries: [`${collection} time-based queries`],
        });
      }
    }
  });

  return recommendations;
}

function generateNextSteps(criticalIssues) {
  const steps = [];

  if (criticalIssues.length > 0) {
    steps.push({
      step: 1,
      action: "Create Missing Indexes",
      description: `${criticalIssues.length} critical issues found requiring immediate index creation`,
      command: "POST /api/admin/optimize-database-indexes",
      priority: "immediate",
    });

    steps.push({
      step: 2,
      action: "Re-run Analysis",
      description: "Verify index creation resolved critical issues",
      command: "GET /api/admin/run-explain-analysis",
      priority: "immediate",
    });
  } else {
    steps.push({
      step: 1,
      action: "Performance Testing",
      description: "No critical issues found - run performance testing",
      command: "GET /api/admin/test-statistics-performance",
      priority: "normal",
    });
  }

  steps.push({
    step: steps.length + 1,
    action: "Monitor Performance",
    description: "Set up ongoing monitoring of query performance",
    command: "Implement query timing logs in statistics endpoints",
    priority: "normal",
  });

  return steps;
}

function getTotalQueriesCount(explainResults) {
  let total = 0;
  Object.values(explainResults).forEach((collection) => {
    if (collection.error) return;
    Object.values(collection).forEach((query) => {
      if (query.queryName) total++;
    });
  });
  return total;
}
