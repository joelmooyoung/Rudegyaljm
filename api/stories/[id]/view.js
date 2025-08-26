import { connectToDatabase } from "../../../lib/mongodb.js";
import { Story } from "../../../models/index.js";

// Minimal rate limiting to prevent rapid double-clicks only
const recentViews = new Map();
const RATE_LIMIT_MS = 100; // 100ms cooldown - only prevents rapid double-clicks

// Story View Tracking API
export default async function handler(req, res) {
  const { id } = req.query || {};
  console.log(`[STORY VIEW API] ${req.method} /api/stories/${id}/view`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { userId, sessionId } = req.body;
    const userKey = userId || sessionId || req.ip || "anonymous";
    const viewKey = `${id}-${userKey}`;

    // Check rate limiting
    const lastView = recentViews.get(viewKey);
    const now = Date.now();

    if (lastView && now - lastView < RATE_LIMIT_MS) {
      const timeSinceLastView = now - lastView;
      console.log(
        `[STORY VIEW API] Rate limited: ${timeSinceLastView}ms since last view for ${viewKey} (limit: ${RATE_LIMIT_MS}ms)`,
      );
      return res.status(200).json({
        success: true,
        message: "View already recorded recently",
        rateLimited: true,
        storyId: id,
        timeSinceLastView,
        rateLimitMs: RATE_LIMIT_MS,
        timestamp: new Date().toISOString(),
      });
    }

    // Record this view attempt
    recentViews.set(viewKey, now);

    // Clean up old entries more aggressively
    if (recentViews.size > 100) {
      const cutoff = now - RATE_LIMIT_MS * 5;
      for (const [key, time] of recentViews.entries()) {
        if (time < cutoff) {
          recentViews.delete(key);
        }
      }
    }

    console.log(
      `[STORY VIEW API] Recording view for story ${id} by user ${userKey}`,
    );

    // Connect to production database with timeout protection
    const connectPromise = connectToDatabase();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), 3000),
    );

    try {
      await Promise.race([connectPromise, timeoutPromise]);
    } catch (dbError) {
      console.warn(
        `[STORY VIEW API] Database connection failed: ${dbError.message}`,
      );
      return res.status(200).json({
        success: false,
        message:
          "View recording temporarily unavailable due to database issues",
        fallback: true,
        storyId: id,
        timestamp: new Date().toISOString(),
      });
    }

    // Find and update the story view count in MongoDB with timeout protection
    console.log(`[STORY VIEW API DEBUG] Looking for story with storyId: ${id}`);

    const dbOperations = async () => {
      // First ensure viewCount field exists and is a number - check current story
      let currentStory = await Story.findOne({ storyId: id });
      if (!currentStory) {
        throw new Error("Story not found");
      }

      // Get the actual view count from raw object (use views field - correct schema field)
      const storyObj = currentStory.toObject();
      const actualViewCount = storyObj.views || 0;

      console.log(
        `[STORY VIEW API DEBUG] Current story viewCount: ${currentStory.viewCount} (property access)`,
      );
      console.log(
        `[STORY VIEW API DEBUG] Raw object viewCount: ${storyObj.viewCount}`,
      );
      console.log(
        `[STORY VIEW API DEBUG] Raw object views: ${storyObj.views}`,
      );
      console.log(
        `[STORY VIEW API DEBUG] Actual viewCount from raw object: ${actualViewCount}`,
      );
      console.log(
        `[STORY VIEW API DEBUG] All story fields:`,
        Object.keys(storyObj),
      );

      // Debug for Amsterdam story specifically
      if (id.toLowerCase().includes('amsterdam')) {
        console.log(`[VIEW API] 🔍 AMSTERDAM BEFORE INCREMENT:`, {
          storyId: id,
          rawViewCount: storyObj.viewCount,
          rawViews: storyObj.views,
          actualViewCount: actualViewCount,
          propertyAccess: currentStory.viewCount
        });
      }

      // Only initialize if the field truly doesn't exist - don't overwrite existing values
      if (actualViewCount === undefined || actualViewCount === null) {
        console.log(
          `[STORY VIEW API DEBUG] Views field doesn't exist, initializing to 0`,
        );
        await Story.findOneAndUpdate(
          { storyId: id },
          { $set: { views: 0 } },
        );
      } else {
        console.log(
          `[STORY VIEW API DEBUG] Views field exists (${actualViewCount}), proceeding with increment`,
        );
      }

      // Now increment the view count - ensure we use the right field
      console.log(
        `[STORY VIEW API DEBUG] About to increment viewCount from ${actualViewCount}...`,
      );

      // Check current values before update
      const beforeUpdate = await Story.findOne({ storyId: id });
      const beforeObj = beforeUpdate.toObject();
      console.log(`[STORY VIEW API DEBUG] BEFORE UPDATE:`, {
        viewCount: beforeObj.viewCount,
        views: beforeObj.views
      });

      // Increment only the views field (correct schema field)
      const updateResult = await Story.updateOne(
        { storyId: id },
        {
          $inc: {
            views: 1, // This is the correct schema field
          },
          $set: { updatedAt: new Date() },
        },
      );

      // Check values immediately after update
      const afterUpdate = await Story.findOne({ storyId: id });
      const afterObj = afterUpdate.toObject();
      console.log(`[STORY VIEW API DEBUG] AFTER UPDATE:`, {
        viewCount: afterObj.viewCount,
        views: afterObj.views,
        updateResult: updateResult
      });

      console.log(
        `[STORY VIEW API DEBUG] MongoDB updateOne result:`,
        updateResult,
      );

      // Then get the updated document
      const story = await Story.findOne({ storyId: id });

      console.log(
        `[STORY VIEW API DEBUG] Retrieved updated story after increment`,
      );

      return story;
    };

    // Execute with timeout protection
    const dbTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database operation timeout")), 5000),
    );

    let story;
    try {
      story = await Promise.race([dbOperations(), dbTimeoutPromise]);
    } catch (dbOpError) {
      console.error(
        `[STORY VIEW API] Database operation failed: ${dbOpError.message}`,
      );
      return res.status(200).json({
        success: false,
        message: "View increment failed due to database timeout",
        error: dbOpError.message,
        storyId: id,
        fallback: true,
        timestamp: new Date().toISOString(),
      });
    }

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found after update",
      });
    }

    // Get the actual view count from the raw object to ensure we read correctly
    const storyObj = story.toObject();
    const actualViews = storyObj.views || 0;

    console.log(`[STORY VIEW API DEBUG] MongoDB operation result:`, {
      found: !!story,
      storyId: story.storyId,
      mongoResult_viewCount: story.viewCount,
      rawObject_viewCount: storyObj.viewCount,
      rawObject_views: storyObj.views,
      finalActualViews: actualViews,
      allRawFields: Object.keys(storyObj),
    });

    // Debug for Amsterdam story specifically after increment
    if (id.toLowerCase().includes('amsterdam')) {
      console.log(`[VIEW API] 🔍 AMSTERDAM AFTER INCREMENT:`, {
        storyId: id,
        rawViewCount: storyObj.viewCount,
        rawViews: storyObj.views,
        finalActualViews: actualViews,
        mongoUpdateResult: updateResult
      });
    }

    console.log(
      `[STORY VIEW API] ✅ View recorded for story ${id}. New view count: ${actualViews}`,
    );

    return res.status(200).json({
      success: true,
      message: "View recorded successfully",
      storyId: id,
      newViewCount: actualViews,
      incrementWorked: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[STORY VIEW API] ❌ Error for story ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to record view",
      error: error.message,
    });
  }
}
