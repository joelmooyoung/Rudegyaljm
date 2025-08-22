import { connectToDatabase } from "../../../lib/mongodb.js";
import { Story } from "../../../models/index.js";

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
    console.log(
      `[STORY VIEW API] Recording view for story ${id} by user ${userId || sessionId || "anonymous"}`,
    );

    // Connect to production database with timeout protection
    const connectPromise = connectToDatabase();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 3000)
    );

    try {
      await Promise.race([connectPromise, timeoutPromise]);
    } catch (dbError) {
      console.warn(`[STORY VIEW API] Database connection failed: ${dbError.message}`);
      return res.status(200).json({
        success: false,
        message: "View recording temporarily unavailable due to database issues",
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

      // Get the actual viewCount from raw object (handles Mongoose property access issues)
      const storyObj = currentStory.toObject();
      const actualViewCount = storyObj.viewCount || storyObj.views;

      console.log(`[STORY VIEW API DEBUG] Current story viewCount: ${currentStory.viewCount} (property access)`);
      console.log(`[STORY VIEW API DEBUG] Actual viewCount from raw object: ${actualViewCount}`);
      console.log(`[STORY VIEW API DEBUG] All story fields:`, Object.keys(storyObj));

      // Only initialize if the field truly doesn't exist - don't overwrite existing values
      if (actualViewCount === undefined || actualViewCount === null) {
        console.log(`[STORY VIEW API DEBUG] Field doesn't exist, initializing viewCount to 0`);
        await Story.findOneAndUpdate({ storyId: id }, { $set: { viewCount: 0 } });
      } else {
        console.log(`[STORY VIEW API DEBUG] ViewCount exists (${actualViewCount}), proceeding with increment`);
      }

      // Now increment the view count
      console.log(`[STORY VIEW API DEBUG] Incrementing view count...`);
      const story = await Story.findOneAndUpdate(
        { storyId: id },
        { $inc: { viewCount: 1 } },
        { new: true, upsert: false },
      );

      return story;
    };

    // Execute with timeout protection
    const dbTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timeout')), 5000)
    );

    let story;
    try {
      story = await Promise.race([dbOperations(), dbTimeoutPromise]);
    } catch (dbOpError) {
      console.error(`[STORY VIEW API] Database operation failed: ${dbOpError.message}`);
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
    const actualViews = storyObj.viewCount || 0;

    console.log(`[STORY VIEW API DEBUG] Update result:`, {
      found: !!story,
      viewCount: actualViews,
      storyId: story.storyId,
    });

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
