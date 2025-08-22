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

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error("[STORIES CACHED] Database connection failed, falling back to minimal API with real comment counts");
      // Fallback to minimal API when database has issues, but ensure we get real comment counts
      req.query.includeRealCommentCounts = 'true';
      const { default: minimalHandler } = await import("./stories-minimal.js");
      return minimalHandler(req, res);
    }

    // Add timeout protection for database operations
    const timeoutMs = 5000; // 5 second timeout

    const dbOperations = async () => {
      // Simple approach: Get stories first, then get their cached stats
      console.log("[STORIES CACHED] Getting stories...");
      const stories = await Story.find({ published: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('storyId title author category tags excerpt accessLevel image audioUrl createdAt updatedAt')
        .lean(); // Use lean() for better performance

      console.log(`[STORIES CACHED] Found ${stories.length} stories, getting cached stats...`);

      // Get story IDs for cache lookup
      const storyIds = stories.map(story => story.storyId);

      // Get cached stats for these stories
      console.log(`[STORIES CACHED] Looking up cached stats for story IDs:`, storyIds.slice(0, 3));

      const cachedStats = await StoryStatsCache.find({
        storyId: { $in: storyIds }
      }).lean();

      console.log(`[STORIES CACHED] Found ${cachedStats.length} cached stats entries`);

      if (cachedStats.length > 0) {
        console.log(`[STORIES CACHED] Sample cached stat:`, cachedStats[0]);
      }

      // Get total count for pagination (separate query but still efficient)
      const totalStories = await Story.countDocuments({ published: true });

      return { stories, cachedStats, totalStories };
    };

    // Execute with timeout protection
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
    );

    let stories, cachedStats, totalStories;

    try {
      const result = await Promise.race([
        dbOperations(),
        timeoutPromise
      ]);
      stories = result.stories;
      cachedStats = result.cachedStats;
      totalStories = result.totalStories;
    } catch (timeoutError) {
      console.warn("[STORIES CACHED] Database operations timed out, falling back to minimal API");
      const { default: minimalHandler } = await import("./stories-minimal.js");
      return minimalHandler(req, res);
    }

    // Create a map for fast lookup
    const statsMap = new Map();
    cachedStats.forEach(stat => {
      statsMap.set(stat.storyId, stat);
    });
    const totalPages = Math.ceil(totalStories / limit);

    // Transform to expected format using cached stats
    const transformedStories = stories.map(story => {
      const cachedStat = statsMap.get(story.storyId);

      return {
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
        // Use cached stats if available, fallback to 0
        viewCount: cachedStat?.viewCount || 0,
        likeCount: cachedStat?.likeCount || 0,
        commentCount: cachedStat?.commentCount || 0,
        rating: cachedStat?.rating || 0,
        ratingCount: cachedStat?.ratingCount || 0,
        image: story.image || null,
        audioUrl: story.audioUrl || null,
        // Metadata
        lastStatsUpdate: cachedStat?.lastCalculated || null
      };
    });

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
        databaseQueries: 3, // Simple approach: stories + cached stats + count
        cachedStatsFound: cachedStats.length,
        totalStoriesRequested: stories.length
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
