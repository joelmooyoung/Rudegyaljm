import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[CHECK AMSTERDAM] Checking current state...`);

  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    const storiesCollection = db.collection("stories");

    // Get current state
    const story = await storiesCollection.findOne({ storyId: "1755540821501" });

    console.log(`[CHECK AMSTERDAM] Current fields:`, {
      viewCount: story.viewCount,
      views: story.views,
      viewCountType: typeof story.viewCount,
      viewsType: typeof story.views,
      maxValue: Math.max(story.viewCount || 0, story.views || 0),
    });

    return res.json({
      success: true,
      message: "Amsterdam story current state",
      fields: {
        viewCount: story.viewCount,
        views: story.views,
        maxValue: Math.max(story.viewCount || 0, story.views || 0),
      },
    });
  } catch (error) {
    console.error(`[CHECK AMSTERDAM] Error:`, error);
    return res.status(500).json({
      error: error.message,
    });
  }
}
