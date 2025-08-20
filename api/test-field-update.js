import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[TEST FIELD UPDATE] ${req.method} /api/test-field-update`);

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
    await connectToDatabase();
    console.log("[TEST FIELD UPDATE] Connected to database");

    const storyId = "1755540821501";
    
    // Test 1: Get current story
    const currentStory = await Story.findOne({ storyId });
    console.log("[TEST FIELD UPDATE] Current story views:", currentStory?.views);

    // Test 2: Force set views to 100
    console.log("[TEST FIELD UPDATE] Setting views to 100...");
    const updateResult = await Story.findOneAndUpdate(
      { storyId },
      { $set: { views: 100 } },
      { new: true }
    );
    console.log("[TEST FIELD UPDATE] After setting to 100:", updateResult?.views);

    // Test 3: Increment views by 1
    console.log("[TEST FIELD UPDATE] Incrementing views by 1...");
    const incResult = await Story.findOneAndUpdate(
      { storyId },
      { $inc: { views: 1 } },
      { new: true }
    );
    console.log("[TEST FIELD UPDATE] After increment:", incResult?.views);

    // Test 4: Read the story again
    const finalStory = await Story.findOne({ storyId });
    console.log("[TEST FIELD UPDATE] Final views:", finalStory?.views);

    return res.status(200).json({
      success: true,
      message: "Field test completed",
      results: {
        initial: currentStory?.views,
        afterSet: updateResult?.views,
        afterIncrement: incResult?.views,
        final: finalStory?.views,
      }
    });

  } catch (error) {
    console.error("[TEST FIELD UPDATE] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
    });
  }
}
