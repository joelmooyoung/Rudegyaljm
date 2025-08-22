import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[TEST VIEW INCREMENT] ${req.method} /api/test-view-increment`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    if (req.method === "GET") {
      // Get current view count for story3 (Summer Heat)
      const story = await Story.findOne({ storyId: "story3" });
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: "Story not found"
        });
      }

      const storyObj = story.toObject();
      
      return res.json({
        success: true,
        storyId: "story3",
        currentViewCount: storyObj.viewCount || 0,
        allFields: Object.keys(storyObj),
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === "POST") {
      // Test incrementing view count for story3
      console.log("[TEST VIEW INCREMENT] Testing view increment for story3...");
      
      // Get current count
      const beforeStory = await Story.findOne({ storyId: "story3" });
      const beforeCount = beforeStory?.toObject()?.viewCount || 0;
      
      console.log(`[TEST VIEW INCREMENT] Before increment: ${beforeCount}`);
      
      // Increment
      const updatedStory = await Story.findOneAndUpdate(
        { storyId: "story3" },
        { $inc: { viewCount: 1 } },
        { new: true }
      );
      
      const afterCount = updatedStory?.toObject()?.viewCount || 0;
      
      console.log(`[TEST VIEW INCREMENT] After increment: ${afterCount}`);
      
      return res.json({
        success: true,
        storyId: "story3",
        beforeCount,
        afterCount,
        incrementWorked: afterCount > beforeCount,
        difference: afterCount - beforeCount,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });

  } catch (error) {
    console.error("[TEST VIEW INCREMENT] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message
    });
  }
}
