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
    console.log(`[STORY VIEW API] Recording view for story ${id} by user ${userId || sessionId || 'anonymous'}`);

    // Connect to production database
    await connectToDatabase();

    // Find and update the story view count in MongoDB
    console.log(`[STORY VIEW API DEBUG] Looking for story with storyId: ${id}`);

    // First ensure views field exists and is a number - check current story
    let currentStory = await Story.findOne({ storyId: id });
    if (!currentStory) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Initialize views if it's null/undefined
    if (currentStory.views === undefined || currentStory.views === null || isNaN(currentStory.views)) {
      await Story.findOneAndUpdate(
        { storyId: id },
        { $set: { views: 0 } }
      );
    }

    // Now increment the view count
    const story = await Story.findOneAndUpdate(
      { storyId: id },
      { $inc: { views: 1 } },
      { new: true, upsert: false }
    );

    console.log(`[STORY VIEW API DEBUG] Update result:`, {
      found: !!story,
      views: story?.views,
      storyId: story?.storyId
    });

    console.log(`[STORY VIEW API] ✅ View recorded for story ${id}. New view count: ${story.views}`);

    return res.status(200).json({
      success: true,
      message: "View recorded successfully",
      storyId: id,
      newViewCount: story.views,
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
