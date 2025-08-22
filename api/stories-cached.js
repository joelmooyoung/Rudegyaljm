import { connectToDatabase } from "../lib/mongodb.js";
import { Story, StoryStatsCache } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[STORIES CACHED] ${req.method} /api/stories-cached`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const startTime = Date.now();
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    console.log(`[STORIES CACHED] Fetching page ${page} (limit: ${limit}) using cached stats...`);

    await connectToDatabase();

    // Single efficient query: Get stories with their cached stats in one join operation
    const pipeline = [
      // Match published stories
      { $match: { published: true } },
      
      // Sort by creation date (newest first)
      { $sort: { createdAt: -1 } },
      
      // Join with stats cache
      {
        $lookup: {
          from: 'storystatsches', // MongoDB collection name (pluralized)
          localField: 'storyId',
          foreignField: 'storyId',
          as: 'statsCache'
        }
      },
      
      // Add stats fields from cache (with fallbacks)
      {
        $addFields: {
          cachedViewCount: { $ifNull: [{ $arrayElemAt: ['$statsCache.viewCount', 0] }, 0] },
          cachedLikeCount: { $ifNull: [{ $arrayElemAt: ['$statsCache.likeCount', 0] }, 0] },
          cachedCommentCount: { $ifNull: [{ $arrayElemAt: ['$statsCache.commentCount', 0] }, 0] },
          cachedRating: { $ifNull: [{ $arrayElemAt: ['$statsCache.rating', 0] }, 0] },
          cachedRatingCount: { $ifNull: [{ $arrayElemAt: ['$statsCache.ratingCount', 0] }, 0] },
          lastStatsUpdate: { $arrayElemAt: ['$statsCache.lastCalculated', 0] }
        }
      },
      
      // Project only needed fields for better performance
      {
        $project: {
          storyId: 1,
          title: 1,
          author: 1,
          category: 1,
          tags: 1,
          excerpt: 1,
          accessLevel: 1,
          image: 1,
          audioUrl: 1,
          createdAt: 1,
          updatedAt: 1,
          // Use cached stats
          viewCount: '$cachedViewCount',
          likeCount: '$cachedLikeCount', 
          commentCount: '$cachedCommentCount',
          rating: '$cachedRating',
          ratingCount: '$cachedRatingCount',
          lastStatsUpdate: 1
        }
      },
      
      // Pagination
      { $skip: skip },
      { $limit: limit }
    ];

    // Execute the aggregation pipeline
    const stories = await Story.aggregate(pipeline);

    // Get total count for pagination (separate query but still efficient)
    const totalStories = await Story.countDocuments({ published: true });
    const totalPages = Math.ceil(totalStories / limit);

    // Transform to expected format
    const transformedStories = stories.map(story => ({
      id: story.storyId,
      title: story.title || "Untitled",
      author: story.author || "Unknown Author",
      excerpt: story.excerpt || `A ${story.category || 'passionate'} story by ${story.author}`,
      content: "Click to read this captivating story...", // Placeholder - actual content loaded separately
      tags: Array.isArray(story.tags) ? story.tags : ["passion", "romance"],
      category: story.category || "Romance",
      accessLevel: story.accessLevel || "free",
      isPublished: true,
      createdAt: story.createdAt || new Date(),
      updatedAt: story.updatedAt || new Date(),
      // Cached stats (no database calculation needed!)
      viewCount: story.viewCount || 0,
      likeCount: story.likeCount || 0, 
      commentCount: story.commentCount || 0,
      rating: story.rating || 0,
      ratingCount: story.ratingCount || 0,
      image: story.image || null,
      audioUrl: story.audioUrl || null,
      // Metadata
      lastStatsUpdate: story.lastStatsUpdate
    }));

    const queryTime = Date.now() - startTime;

    console.log(`[STORIES CACHED] ✅ Retrieved ${transformedStories.length} stories with cached stats in ${queryTime}ms`);

    return res.status(200).json({
      success: true,
      stories: transformedStories,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalStories: totalStories,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit: limit
      },
      performance: {
        queryTimeMs: queryTime,
        usingCachedStats: true,
        databaseQueries: 2 // Only 2 queries: stories+stats join + count
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[STORIES CACHED] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load stories with cached stats",
      error: error.message
    });
  }
}
