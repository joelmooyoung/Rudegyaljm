// Statistics Query EXPLAIN Analysis Script
import { connectToDatabase } from "../../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[EXPLAIN STATS] ${req.method} /api/admin/explain-statistics-queries`);

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
    console.log("[EXPLAIN STATS] Starting comprehensive EXPLAIN analysis of statistics queries...");

    // Date calculations for time-based queries
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Define all statistics queries with their categories
    const statisticsQueries = [
      
      // === USER COLLECTION QUERIES ===
      {
        category: "User Analytics",
        name: "Active Users Count",
        collection: "users",
        type: "count",
        query: () => db.collection("users").find({ active: true }).explain("executionStats")
      },
      {
        category: "User Analytics", 
        name: "Users by Type Distribution",
        collection: "users",
        type: "aggregation",
        query: () => db.collection("users").aggregate([
          { $match: { active: true } },
          { $group: { _id: "$type", count: { $sum: 1 } } }
        ]).explain("executionStats")
      },
      {
        category: "User Analytics",
        name: "Users by Country (Top 10)",
        collection: "users", 
        type: "aggregation",
        query: () => db.collection("users").aggregate([
          { $match: { active: true } },
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).explain("executionStats")
      },
      {
        category: "User Analytics",
        name: "New Users This Week",
        collection: "users",
        type: "count",
        query: () => db.collection("users").find({
          active: true,
          createdAt: { $gte: oneWeekAgo }
        }).explain("executionStats")
      },
      {
        category: "User Analytics",
        name: "All Users with Sorting",
        collection: "users",
        type: "find",
        query: () => db.collection("users").find({}, {
          projection: { password: 0, __v: 0 }
        }).sort({ createdAt: -1 }).explain("executionStats")
      },

      // === STORY COLLECTION QUERIES ===
      {
        category: "Story Analytics",
        name: "Published Stories Count", 
        collection: "stories",
        type: "count",
        query: () => db.collection("stories").find({ published: true }).explain("executionStats")
      },
      {
        category: "Story Analytics",
        name: "Published Stories with Date Sorting",
        collection: "stories",
        type: "find",
        query: () => db.collection("stories").find(
          { published: true },
          {
            projection: {
              storyId: 1, title: 1, author: 1, category: 1, 
              accessLevel: 1, createdAt: 1, viewCount: 1, views: 1,
              likeCount: 1, commentCount: 1, rating: 1, averageRating: 1
            }
          }
        ).sort({ createdAt: -1 }).limit(10).explain("executionStats")
      },
      {
        category: "Story Analytics",
        name: "Stories by Category",
        collection: "stories",
        type: "aggregation", 
        query: () => db.collection("stories").aggregate([
          { $match: { published: true } },
          { $group: { _id: "$category", count: { $sum: 1 } } }
        ]).explain("executionStats")
      },
      {
        category: "Story Analytics",
        name: "Stories by Access Level",
        collection: "stories",
        type: "aggregation",
        query: () => db.collection("stories").aggregate([
          { $match: { published: true } },
          { $group: { _id: "$accessLevel", count: { $sum: 1 } } }
        ]).explain("executionStats")
      },
      {
        category: "Story Analytics",
        name: "New Stories This Week",
        collection: "stories",
        type: "count",
        query: () => db.collection("stories").find({
          published: true,
          createdAt: { $gte: oneWeekAgo }
        }).explain("executionStats")
      },
      {
        category: "Story Analytics",
        name: "Story Statistics Aggregation",
        collection: "stories",
        type: "aggregation",
        query: () => db.collection("stories").aggregate([
          { $match: { published: true } },
          {
            $group: {
              _id: null,
              totalLikes: { $sum: { $ifNull: ["$likeCount", 0] } },
              totalViews: {
                $sum: {
                  $max: [
                    { $ifNull: ["$viewCount", 0] },
                    { $ifNull: ["$views", 0] }
                  ]
                }
              },
              totalRatings: { $sum: { $ifNull: ["$ratingCount", 0] } },
            },
          },
        ]).explain("executionStats")
      },

      // === COMMENT COLLECTION QUERIES ===
      {
        category: "Comment Analytics",
        name: "Total Comments Count",
        collection: "comments",
        type: "count",
        query: () => db.collection("comments").find({}).explain("executionStats")
      },
      {
        category: "Comment Analytics", 
        name: "Comments This Week",
        collection: "comments",
        type: "count",
        query: () => db.collection("comments").find({
          createdAt: { $gte: oneWeekAgo }
        }).explain("executionStats")
      },
      {
        category: "Comment Analytics",
        name: "Most Commented Stories",
        collection: "comments",
        type: "aggregation",
        query: () => db.collection("comments").aggregate([
          { $group: { _id: "$storyId", commentCount: { $sum: 1 } } },
          { $sort: { commentCount: -1 } },
          { $limit: 10 }
        ]).explain("executionStats")
      },
      {
        category: "Comment Analytics",
        name: "Comments by Story ID (Lookup Pattern)",
        collection: "comments", 
        type: "aggregation",
        query: () => db.collection("comments").aggregate([
          { $match: { storyId: { $in: ["story1", "story2", "story3"] } } },
          { $group: { _id: "$storyId", count: { $sum: 1 } } }
        ]).explain("executionStats")
      },

      // === LIKE COLLECTION QUERIES ===
      {
        category: "Like Analytics",
        name: "Total Likes Count",
        collection: "likes", 
        type: "count",
        query: () => db.collection("likes").find({}).explain("executionStats")
      },
      {
        category: "Like Analytics",
        name: "Likes This Week",
        collection: "likes",
        type: "count", 
        query: () => db.collection("likes").find({
          createdAt: { $gte: oneWeekAgo }
        }).explain("executionStats")
      },
      {
        category: "Like Analytics",
        name: "Most Liked Stories",
        collection: "likes",
        type: "aggregation",
        query: () => db.collection("likes").aggregate([
          { $group: { _id: "$storyId", likeCount: { $sum: 1 } } },
          { $sort: { likeCount: -1 } },
          { $limit: 10 }
        ]).explain("executionStats")
      },

      // === RATING COLLECTION QUERIES ===
      {
        category: "Rating Analytics",
        name: "Total Ratings Count",
        collection: "ratings",
        type: "count",
        query: () => db.collection("ratings").find({}).explain("executionStats")
      },
      {
        category: "Rating Analytics",
        name: "Ratings This Week",
        collection: "ratings",
        type: "count",
        query: () => db.collection("ratings").find({
          createdAt: { $gte: oneWeekAgo }
        }).explain("executionStats")
      },
      {
        category: "Rating Analytics",
        name: "Top Rated Stories (Min 5 Ratings)",
        collection: "ratings",
        type: "aggregation",
        query: () => db.collection("ratings").aggregate([
          { 
            $group: { 
              _id: "$storyId", 
              avgRating: { $avg: "$rating" },
              ratingCount: { $sum: 1 }
            }
          },
          { $match: { ratingCount: { $gte: 5 } } },
          { $sort: { avgRating: -1 } },
          { $limit: 10 }
        ]).explain("executionStats")
      },

      // === LOGIN LOG QUERIES ===
      {
        category: "Login Analytics",
        name: "Logins This Week",
        collection: "loginlogs",
        type: "count",
        query: () => db.collection("loginlogs").find({
          timestamp: { $gte: oneWeekAgo }
        }).explain("executionStats")
      },
      {
        category: "Login Analytics", 
        name: "Successful Logins This Week",
        collection: "loginlogs",
        type: "count",
        query: () => db.collection("loginlogs").find({
          timestamp: { $gte: oneWeekAgo },
          success: true
        }).explain("executionStats")
      },
      {
        category: "Login Analytics",
        name: "Login Success Rate Analysis",
        collection: "loginlogs",
        type: "aggregation",
        query: () => db.collection("loginlogs").aggregate([
          { $match: { timestamp: { $gte: oneMonthAgo } } },
          { $group: { _id: "$success", count: { $sum: 1 } } }
        ]).explain("executionStats")
      },
      {
        category: "Login Analytics",
        name: "Logins by Country",
        collection: "loginlogs",
        type: "aggregation",
        query: () => db.collection("loginlogs").aggregate([
          { $match: { timestamp: { $gte: oneMonthAgo } } },
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).explain("executionStats")
      },

      // === USER STORY READ QUERIES ===
      {
        category: "Reading Analytics",
        name: "Stories Read This Week",
        collection: "userstoryreads",
        type: "count",
        query: () => db.collection("userstoryreads").find({
          timestamp: { $gte: oneWeekAgo }
        }).explain("executionStats")
      },
      {
        category: "Reading Analytics",
        name: "Most Read Stories This Week",
        collection: "userstoryreads", 
        type: "aggregation",
        query: () => db.collection("userstoryreads").aggregate([
          { $match: { timestamp: { $gte: oneWeekAgo } } },
          { $group: { _id: "$storyId", readCount: { $sum: 1 } } },
          { $sort: { readCount: -1 } },
          { $limit: 10 }
        ]).explain("executionStats")
      },
      {
        category: "Reading Analytics",
        name: "User Reading History",
        collection: "userstoryreads",
        type: "find",
        query: () => db.collection("userstoryreads").find({
          userId: "testuser123"
        }).sort({ timestamp: -1 }).limit(20).explain("executionStats")
      }
    ];

    console.log(`[EXPLAIN STATS] Analyzing ${statisticsQueries.length} statistics queries...`);

    const analysisResults = [];
    let totalQueries = 0;
    let problemQueries = 0;

    // Analyze each query
    for (const queryDef of statisticsQueries) {
      try {
        console.log(`[EXPLAIN STATS] Analyzing: ${queryDef.name}...`);
        
        const startTime = Date.now();
        const explainResult = await queryDef.query();
        const executionTime = Date.now() - startTime;
        
        totalQueries++;

        // Analyze execution plan
        const analysis = analyzeExecutionPlan(explainResult, queryDef);
        analysis.actualExecutionTime = executionTime;

        if (analysis.issues.length > 0) {
          problemQueries++;
        }

        analysisResults.push({
          ...queryDef,
          analysis,
          explainOutput: explainResult
        });

        console.log(`[EXPLAIN STATS] ✅ ${queryDef.name}: ${executionTime}ms (${analysis.issues.length} issues)`);

      } catch (queryError) {
        console.log(`[EXPLAIN STATS] ❌ ${queryDef.name} failed:`, queryError.message);
        analysisResults.push({
          ...queryDef,
          error: queryError.message,
          analysis: { issues: [{ type: "error", severity: "high", message: queryError.message }] }
        });
        problemQueries++;
      }
    }

    // Generate comprehensive recommendations
    const recommendations = generateOptimizationRecommendations(analysisResults);

    // Group results by category and severity
    const resultsByCategory = groupResultsByCategory(analysisResults);
    const criticalIssues = analysisResults.filter(r => 
      r.analysis && r.analysis.issues.some(i => i.severity === "high")
    );

    console.log(`[EXPLAIN STATS] ✅ Analysis complete: ${totalQueries} queries, ${problemQueries} with issues`);

    return res.status(200).json({
      success: true,
      summary: {
        totalQueries,
        problemQueries,
        criticalIssues: criticalIssues.length,
        analysisTime: Date.now() - Date.now()
      },
      recommendations,
      resultsByCategory,
      criticalIssues: criticalIssues.map(r => ({
        name: r.name,
        category: r.category,
        issues: r.analysis.issues
      })),
      detailedResults: analysisResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[EXPLAIN STATS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze statistics queries",
      error: error.message
    });
  }
}

function analyzeExecutionPlan(explainResult, queryDef) {
  const issues = [];
  const analysis = {
    indexesUsed: [],
    documentsExamined: 0,
    documentsReturned: 0,
    executionTimeEstimate: 0,
    stages: [],
    issues: []
  };

  try {
    let executionStats;
    
    // Handle different explain result formats
    if (explainResult.executionStats) {
      executionStats = explainResult.executionStats;
    } else if (explainResult.stages) {
      // Aggregation pipeline explain
      const lastStage = explainResult.stages[explainResult.stages.length - 1];
      if (lastStage && lastStage.$cursor && lastStage.$cursor.executionStats) {
        executionStats = lastStage.$cursor.executionStats;
      }
    }

    if (executionStats) {
      analysis.documentsExamined = executionStats.totalDocsExamined || 0;
      analysis.documentsReturned = executionStats.totalDocsReturned || 0;
      analysis.executionTimeEstimate = executionStats.executionTimeMillisEstimate || 0;

      // Check for full collection scans
      if (executionStats.executionStages) {
        const stage = executionStats.executionStages;
        analysis.stages.push(stage.stage);

        if (stage.stage === "COLLSCAN") {
          issues.push({
            type: "full_collection_scan",
            severity: "high",
            message: `Full collection scan detected. Consider adding an index for query pattern.`,
            affectedFields: extractQueryFields(queryDef)
          });
        }

        if (stage.stage === "IXSCAN") {
          analysis.indexesUsed.push(stage.indexName);
          
          // Check for inefficient index usage
          if (analysis.documentsExamined > analysis.documentsReturned * 10) {
            issues.push({
              type: "inefficient_index",
              severity: "medium", 
              message: `Index scan examined ${analysis.documentsExamined} docs to return ${analysis.documentsReturned}. Index may not be selective enough.`,
              indexName: stage.indexName
            });
          }
        }
      }

      // Check for slow queries
      if (analysis.executionTimeEstimate > 100) {
        issues.push({
          type: "slow_query",
          severity: analysis.executionTimeEstimate > 1000 ? "high" : "medium",
          message: `Query estimated execution time: ${analysis.executionTimeEstimate}ms. Consider optimization.`
        });
      }

      // Check for large document examinations
      if (analysis.documentsExamined > 1000 && queryDef.type === "count") {
        issues.push({
          type: "large_scan",
          severity: "medium",
          message: `Count query examined ${analysis.documentsExamined} documents. Consider compound indexes.`
        });
      }
    }

    // Aggregation-specific analysis
    if (queryDef.type === "aggregation" && explainResult.stages) {
      for (const stage of explainResult.stages) {
        if (stage.$match && !stage.$match.inputStage) {
          issues.push({
            type: "aggregation_optimization",
            severity: "medium",
            message: "$match stage should be first in aggregation pipeline for better performance."
          });
        }
      }
    }

  } catch (analysisError) {
    issues.push({
      type: "analysis_error",
      severity: "low", 
      message: `Could not fully analyze execution plan: ${analysisError.message}`
    });
  }

  analysis.issues = issues;
  return analysis;
}

function extractQueryFields(queryDef) {
  // Simple field extraction from query definition
  const fields = [];
  if (queryDef.name.includes("active")) fields.push("active");
  if (queryDef.name.includes("published")) fields.push("published");
  if (queryDef.name.includes("createdAt") || queryDef.name.includes("Week") || queryDef.name.includes("Month")) {
    fields.push("createdAt");
  }
  if (queryDef.name.includes("timestamp")) fields.push("timestamp");
  if (queryDef.name.includes("country")) fields.push("country");
  if (queryDef.name.includes("type")) fields.push("type");
  if (queryDef.name.includes("category")) fields.push("category");
  if (queryDef.name.includes("storyId")) fields.push("storyId");
  if (queryDef.name.includes("userId")) fields.push("userId");
  
  return fields.length > 0 ? fields : ["unknown"];
}

function generateOptimizationRecommendations(results) {
  const recommendations = [];
  
  // Group issues by type
  const issuesByType = {};
  results.forEach(result => {
    if (result.analysis && result.analysis.issues) {
      result.analysis.issues.forEach(issue => {
        if (!issuesByType[issue.type]) {
          issuesByType[issue.type] = [];
        }
        issuesByType[issue.type].push({ ...issue, queryName: result.name });
      });
    }
  });

  // Generate recommendations based on issue patterns
  Object.entries(issuesByType).forEach(([issueType, issues]) => {
    switch (issueType) {
      case "full_collection_scan":
        recommendations.push({
          type: "index_creation",
          priority: "high",
          title: "Create Missing Indexes for Collection Scans",
          description: `${issues.length} queries are performing full collection scans.`,
          affectedQueries: issues.map(i => i.queryName),
          solution: "Create compound indexes for frequently queried field combinations.",
          suggestedIndexes: generateSuggestedIndexes(issues)
        });
        break;

      case "slow_query":
        recommendations.push({
          type: "query_optimization", 
          priority: "high",
          title: "Optimize Slow Queries",
          description: `${issues.length} queries are executing slowly.`,
          affectedQueries: issues.map(i => i.queryName),
          solution: "Review query patterns and add appropriate indexes or optimize aggregation pipelines."
        });
        break;

      case "inefficient_index":
        recommendations.push({
          type: "index_optimization",
          priority: "medium", 
          title: "Optimize Index Selectivity",
          description: `${issues.length} queries are using indexes inefficiently.`,
          affectedQueries: issues.map(i => i.queryName),
          solution: "Create more selective compound indexes or adjust query patterns."
        });
        break;

      case "large_scan":
        recommendations.push({
          type: "performance_optimization",
          priority: "medium",
          title: "Reduce Document Examination",
          description: `${issues.length} queries are examining large numbers of documents.`,
          affectedQueries: issues.map(i => i.queryName),
          solution: "Add covering indexes or implement result caching for frequently accessed data."
        });
        break;
    }
  });

  return recommendations;
}

function generateSuggestedIndexes(issues) {
  const indexes = [];
  
  issues.forEach(issue => {
    if (issue.affectedFields) {
      issue.affectedFields.forEach(field => {
        if (field === "active" || field === "published") {
          indexes.push(`{ ${field}: 1, createdAt: -1 }`);
        } else if (field === "createdAt" || field === "timestamp") {
          indexes.push(`{ ${field}: -1 }`);
        } else {
          indexes.push(`{ ${field}: 1 }`);
        }
      });
    }
  });

  return [...new Set(indexes)]; // Remove duplicates
}

function groupResultsByCategory(results) {
  const grouped = {};
  
  results.forEach(result => {
    if (!grouped[result.category]) {
      grouped[result.category] = [];
    }
    grouped[result.category].push({
      name: result.name,
      collection: result.collection,
      type: result.type,
      issues: result.analysis ? result.analysis.issues.length : 0,
      criticalIssues: result.analysis ? result.analysis.issues.filter(i => i.severity === "high").length : 0
    });
  });

  return grouped;
}
