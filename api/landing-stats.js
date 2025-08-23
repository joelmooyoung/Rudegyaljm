import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[LANDING STATS] ${req.method} /api/landing-stats`);

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

  // Get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8;
  const skip = (page - 1) * limit;

  // Option to include real comment counts
  const includeRealCommentCounts = req.query.includeRealCommentCounts === "true";

  try {
    console.log("[LANDING STATS] Executing optimized combined query...");
    await connectToDatabase();

    if (mongoose.connection.readyState !== 1) {
      console.log("[LANDING STATS] Database not connected");
      return res.status(500).json({
        success: false,
        message: "Database connection not available",
      });
    }

    const db = mongoose.connection.db;
    const storiesCollection = db.collection("stories");
    const commentsCollection = db.collection("comments");

    // Execute all queries in parallel for maximum efficiency
    const startTime = Date.now();

    // First get basic data without dependencies
    const [totalStories, stories, aggregateStats, totalComments] = await Promise.all([
      // Total published stories count
      storiesCollection.countDocuments({ published: true }),

      // Paginated stories with optimized projection
      storiesCollection
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
              likeCount: 1,
              commentCount: 1,
              rating: 1,
              averageRating: 1,
              ratingCount: 1,
              image: 1,
              tags: 1,
              excerpt: 1,
              // Only include what we need, heavy fields automatically excluded
            },
          },
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),

      // Aggregate statistics in one efficient query
      storiesCollection
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
                    { $ifNull: ["$views", 0] }
                  ]
                }
              },
              totalRatings: { $sum: { $ifNull: ["$ratingCount", 0] } },
            },
          },
        ])
        .toArray(),

      // Total comments across all published stories
      commentsCollection
        .aggregate([
          {
            $lookup: {
              from: "stories",
              localField: "storyId",
              foreignField: "storyId",
              as: "story",
            },
          },
          { $match: { "story.published": true } },
          { $count: "totalComments" }
        ])
        .toArray(),
    ]);

    // Now get comment counts if requested (depends on stories being loaded)
    const commentCounts = includeRealCommentCounts && stories?.length > 0
      ? await commentsCollection
          .aggregate([
            {
              $match: {
                storyId: {
                  $in: stories.map(story => story.storyId).filter(id => id)
                }
              }
            },
            { $group: { _id: "$storyId", count: { $sum: 1 } } },
          ])
          .toArray()
      : [];

    const queryTime = Date.now() - startTime;
    console.log(`[LANDING STATS] All queries completed in ${queryTime}ms`);

    // Process results
    const totalPages = Math.ceil(totalStories / limit);
    
    // Create comment count map for efficient lookup
    const commentCountMap = {};
    if (includeRealCommentCounts && commentCounts) {
      commentCounts.forEach((item) => {
        commentCountMap[item._id] = item.count;
      });
      console.log(`[LANDING STATS] Real comment counts:`, commentCountMap);
    }

    // Transform stories with optimized field handling
    const transformedStories = stories.map((story) => ({
      id: story.storyId || story._id.toString(),
      title: story.title || "Untitled",
      content: "Click to read this captivating story...", // Placeholder
      excerpt: story.excerpt || `A ${story.category || "passionate"} story by ${story.author}`,
      author: story.author || "Unknown Author",
      category: story.category || "Romance",
      tags: story.tags || ["passion", "romance"],
      accessLevel: story.accessLevel || "free",
      isPublished: true,
      publishedAt: story.createdAt || new Date(),
      createdAt: story.createdAt || new Date(),
      updatedAt: story.createdAt || new Date(),
      // Use the higher value between viewCount and views for accuracy
      viewCount: Math.max(story.viewCount || 0, story.views || 0),
      rating: story.rating || story.averageRating || 0,
      ratingCount: story.ratingCount || 0,
      likeCount: story.likeCount || 0,
      // Use real comment count if available, otherwise fall back to stored count
      commentCount: includeRealCommentCounts 
        ? (commentCountMap[story.storyId] || 0)
        : (story.commentCount || 0),
      image: story.image || null,
      audioUrl: null, // Excluded for performance
    }));

    // Prepare aggregate statistics
    const stats = {
      totalStories: totalStories,
      totalLikes: aggregateStats[0]?.totalLikes || 0,
      totalViews: aggregateStats[0]?.totalViews || 0,
      totalRatings: aggregateStats[0]?.totalRatings || 0,
      totalComments: totalComments[0]?.totalComments || 0,
    };

    // Prepare pagination info
    const pagination = {
      currentPage: page,
      totalPages: totalPages,
      totalStories: totalStories,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      limit: limit,
    };

    console.log(`[LANDING STATS] ✅ Returning optimized data:`, {
      storiesCount: transformedStories.length,
      aggregateStats: stats,
      queryTime: `${queryTime}ms`
    });

    return res.json({
      success: true,
      // Combined response with all landing page data
      stories: transformedStories,
      pagination: pagination,
      aggregateStats: stats,
      performance: {
        queryTime: queryTime,
        queriesOptimized: 5, // Number of queries combined into parallel execution
        includeRealCommentCounts: includeRealCommentCounts
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[LANDING STATS] Error:", error);
    
    // Provide fallback response
    return res.status(500).json({
      success: false,
      message: "Failed to load landing page statistics",
      error: error.message,
      fallback: {
        aggregateStats: {
          totalStories: 43,
          totalLikes: 270,
          totalViews: 52401,
          totalRatings: 1314,
          totalComments: 41
        }
      }
    });
  }
}
