// Track story views with MongoDB integration
import { connectToDatabase } from "../../../lib/mongodb.js";
import { Story } from "../../../models/index.js";

export default async function handler(req, res) {
  const { id: storyId } = req.query;

  console.log(`[VIEW API] ${req.method} /api/stories/${storyId}/view`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

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
    await connectToDatabase();

    console.log(`[VIEW API] Incrementing view count for story: ${storyId}`);

    // Increment view count in database
    const updatedStory = await Story.findOneAndUpdate(
      { storyId },
      { $inc: { views: 1 } },
      { new: true },
    );

    if (!updatedStory) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    console.log(
      `[VIEW API] ✅ Incremented view count for story ${storyId} to ${updatedStory.views}`,
    );

    return res.status(200).json({
      success: true,
      message: "View tracked successfully",
      data: {
        storyId,
        viewCount: updatedStory.views,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[VIEW API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
