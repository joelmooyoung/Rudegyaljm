import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    console.log("[SYNC FIELDS] Starting field synchronization...");
    await connectToDatabase();

    // Get all stories
    const stories = await Story.find({});

    let updatedCount = 0;
    const updates = [];

    for (const story of stories) {
      const storyObj = story.toObject();
      const updateData = {};
      let needsUpdate = false;

      // Sync viewCount: use viewCount if it exists and is greater, otherwise use views
      if (storyObj.viewCount !== undefined && storyObj.views !== undefined) {
        if (storyObj.viewCount !== storyObj.views) {
          const maxViews = Math.max(
            storyObj.viewCount || 0,
            storyObj.views || 0,
          );
          updateData.viewCount = maxViews;
          updateData.views = maxViews;
          needsUpdate = true;
        }
      } else if (
        storyObj.views !== undefined &&
        storyObj.viewCount === undefined
      ) {
        updateData.viewCount = storyObj.views;
        needsUpdate = true;
      } else if (
        storyObj.viewCount !== undefined &&
        storyObj.views === undefined
      ) {
        updateData.views = storyObj.viewCount;
        needsUpdate = true;
      }

      // Sync rating: use rating if it exists and is greater, otherwise use averageRating
      if (
        storyObj.rating !== undefined &&
        storyObj.averageRating !== undefined
      ) {
        if (storyObj.rating !== storyObj.averageRating) {
          const maxRating = Math.max(
            storyObj.rating || 0,
            storyObj.averageRating || 0,
          );
          updateData.rating = maxRating;
          updateData.averageRating = maxRating;
          needsUpdate = true;
        }
      } else if (
        storyObj.averageRating !== undefined &&
        storyObj.rating === undefined
      ) {
        updateData.rating = storyObj.averageRating;
        needsUpdate = true;
      } else if (
        storyObj.rating !== undefined &&
        storyObj.averageRating === undefined
      ) {
        updateData.averageRating = storyObj.rating;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Story.findByIdAndUpdate(story._id, { $set: updateData });
        updates.push({
          storyId: story.storyId,
          title: story.title,
          changes: updateData,
        });
        updatedCount++;
      }
    }

    console.log(`[SYNC FIELDS] ✅ Updated ${updatedCount} stories`);

    return res.status(200).json({
      success: true,
      message: `Synchronized field names for ${updatedCount} stories`,
      totalStories: stories.length,
      updatedStories: updatedCount,
      updates: updates.slice(0, 5), // Show first 5 examples
    });
  } catch (error) {
    console.error("[SYNC FIELDS] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
