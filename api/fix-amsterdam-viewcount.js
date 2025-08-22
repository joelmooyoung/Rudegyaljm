import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[FIX AMSTERDAM] Fixing view count field conflicts...`);

  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    const storiesCollection = db.collection("stories");

    // Get Amsterdam story raw document
    const story = await storiesCollection.findOne({ storyId: "1755540821501" });

    if (!story) {
      return res.status(404).json({ error: "Amsterdam story not found" });
    }

    console.log(`[FIX AMSTERDAM] Before fix:`, {
      viewCount: story.viewCount,
      views: story.views,
      viewCountType: typeof story.viewCount,
      viewsType: typeof story.views,
    });

    // Use the higher value as the authoritative count
    const correctViewCount = Math.max(story.viewCount || 0, story.views || 0);
    console.log(
      `[FIX AMSTERDAM] Using authoritative count: ${correctViewCount}`,
    );

    // Update both fields to be consistent
    const updateResult = await storiesCollection.updateOne(
      { storyId: "1755540821501" },
      {
        $set: {
          viewCount: correctViewCount,
          views: correctViewCount,
          updatedAt: new Date(),
        },
      },
    );

    console.log(`[FIX AMSTERDAM] Field sync result:`, updateResult);

    // Now increment both fields atomically
    const incrementResult = await storiesCollection.updateOne(
      { storyId: "1755540821501" },
      {
        $inc: {
          viewCount: 1,
          views: 1,
        },
        $set: { updatedAt: new Date() },
      },
    );

    console.log(`[FIX AMSTERDAM] Increment result:`, incrementResult);

    // Verify the final result
    const finalStory = await storiesCollection.findOne({
      storyId: "1755540821501",
    });

    console.log(`[FIX AMSTERDAM] After fix:`, {
      viewCount: finalStory.viewCount,
      views: finalStory.views,
      bothMatch: finalStory.viewCount === finalStory.views,
    });

    return res.json({
      success: true,
      message: "Amsterdam story view count fields fixed and incremented",
      before: {
        viewCount: story.viewCount,
        views: story.views,
      },
      after: {
        viewCount: finalStory.viewCount,
        views: finalStory.views,
      },
      incrementResult,
    });
  } catch (error) {
    console.error(`[FIX AMSTERDAM] Error:`, error);
    return res.status(500).json({
      error: error.message,
    });
  }
}
