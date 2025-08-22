import mongoose from "mongoose";
import { connectToDatabase } from "../lib/mongodb.js";

export default async function handler(req, res) {
  console.log(`[STORIES MINIMAL] ${req.method} /api/stories-minimal`);

  // Enable CORS and disable caching for fresh data
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8; // Reduced to 8 stories per page for better performance
  const skip = (page - 1) * limit;

  // Option to skip expensive comment count aggregation for better performance
  const includeRealCommentCounts =
    req.query.includeRealCommentCounts === "true";
  console.log(
    `[STORIES MINIMAL] includeRealCommentCounts param: ${req.query.includeRealCommentCounts} -> ${includeRealCommentCounts}`,
  );

  try {
    console.log("[STORIES MINIMAL] Loading minimal story metadata...");

    // Connect to database
    await connectToDatabase();

    if (mongoose.connection.readyState !== 1) {
      console.log("[STORIES MINIMAL] Database not connected");
      return res.status(500).json({
        success: false,
        message: "Database connection not available",
      });
    }

    const db = mongoose.connection.db;
    const storiesCollection = db.collection("stories");
    const commentsCollection = db.collection("comments");

    console.log(
      `[STORIES MINIMAL] Getting story data for page ${page} (limit: ${limit})...`,
    );

    // Get total count for pagination
    const totalStories = await storiesCollection.countDocuments({
      published: true,
    });
    const totalPages = Math.ceil(totalStories / limit);

    console.log(
      `[STORIES MINIMAL] Total: ${totalStories} stories, ${totalPages} pages`,
    );

    // Load stories with basic info only - minimal fields to prevent timeout
    const stories = await storiesCollection
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
            image: 1, // Re-enable images - monitor for timeouts
          },
        },
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log(
      `[STORIES MINIMAL] Retrieved ${stories.length} story records for page ${page}`,
    );

    if (stories && stories.length > 0) {
      // Get real comment counts only if requested (for performance)
      let commentCountMap = {};

      if (includeRealCommentCounts) {
        try {
          const storyIds = stories
            .map((story) => story.storyId)
            .filter((id) => id); // Filter out null/undefined

          if (storyIds.length > 0) {
            console.log(
              `[STORIES MINIMAL] Getting real comment counts for ${storyIds.length} stories...`,
            );

            const commentCounts = await Promise.race([
              commentsCollection
                .aggregate([
                  { $match: { storyId: { $in: storyIds } } },
                  { $group: { _id: "$storyId", count: { $sum: 1 } } },
                ])
                .toArray(),
              new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Comment aggregation timeout")),
                1500, // Very short timeout - fallback quickly to static data
              ),
            ),
            ]);

            // Create a map of storyId -> real comment count
            commentCounts.forEach((item) => {
              commentCountMap[item._id] = item.count;
            });

            console.log(
              `[STORIES MINIMAL] Real comment counts:`,
              commentCountMap,
            );
          }
        } catch (error) {
        console.warn(
          `[STORIES MINIMAL] Failed to get real comment counts, using static fallback:`,
          error.message,
        );

        // Use static fallback data for critical stories when database is unstable
        try {
          const fs = await import('fs');
          const path = await import('path');
          const fallbackPath = path.join(process.cwd(), 'data/comment-counts-fallback.json');

          if (fs.existsSync(fallbackPath)) {
            const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
            console.log(`[STORIES MINIMAL] Using static comment count fallback for accurate counts`);

            stories.forEach((story) => {
              if (story.storyId && fallbackData[story.storyId]) {
                commentCountMap[story.storyId] = fallbackData[story.storyId];
              } else {
                commentCountMap[story.storyId] = story.commentCount || 0;
              }
            });
          } else {
            // Final fallback to story document comment counts
            stories.forEach((story) => {
              if (story.storyId) {
                commentCountMap[story.storyId] = story.commentCount || 0;
              }
            });
          }
        } catch (fallbackError) {
          console.warn(`[STORIES MINIMAL] Static fallback failed:`, fallbackError.message);
          // Final fallback to story document comment counts
          stories.forEach((story) => {
            if (story.storyId) {
              commentCountMap[story.storyId] = story.commentCount || 0;
            }
          });
        }
      }
      } else {
        console.log(
          `[STORIES MINIMAL] Using cached comment counts for better performance`,
        );
        // Use existing comment counts from story documents
        stories.forEach((story) => {
          if (story.storyId) {
            commentCountMap[story.storyId] = story.commentCount || 0;
          }
        });
      }

      const transformedStories = stories.map((story) => ({
        id: story.storyId || story._id.toString(),
        title: story.title || "Untitled",
        content: "Click to read this captivating story...", // Simple placeholder
        excerpt: `A ${story.category || "passionate"} story by ${story.author}`, // Generated excerpt
        author: story.author || "Unknown Author",
        category: story.category || "Romance",
        tags: ["passion", "romance"], // Simple default tags
        accessLevel: story.accessLevel || "free",
        isPublished: true,
        publishedAt: story.createdAt || new Date(),
        createdAt: story.createdAt || new Date(),
        updatedAt: story.createdAt || new Date(),
        viewCount: story.viewCount || story.views || 0,
        rating: story.rating || story.averageRating || 0,
        ratingCount: story.ratingCount || 0,
        likeCount: story.likeCount || 0,
        commentCount: commentCountMap[story.storyId] || 0, // Use real comment count
        image: story.image || null, // Use real image data
        audioUrl: null, // Disabled due to DB timeout
      }));

      console.log(
        `[STORIES MINIMAL] Returning ${transformedStories.length} stories with images for page ${page}`,
      );
      return res.json({
        stories: transformedStories,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalStories: totalStories,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          limit: limit,
        },
      });
    } else {
      console.log("[STORIES MINIMAL] No stories found");
      return res.json({
        stories: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalStories: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          limit: limit,
        },
      });
    }
  } catch (error) {
    console.error("[STORIES MINIMAL] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load minimal stories",
      error: error.message,
    });
  }
}
