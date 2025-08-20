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
    
    // Test 1: Get current story and check both fields
    const currentStory = await Story.findOne({ storyId });
    console.log("[TEST FIELD UPDATE] Current story views:", currentStory?.views);
    console.log("[TEST FIELD UPDATE] Current story viewCount:", currentStory?.viewCount);
    console.log("[TEST FIELD UPDATE] Current story toObject():", JSON.stringify({
      views: currentStory?.views,
      viewCount: currentStory?.viewCount,
      likeCount: currentStory?.likeCount,
      averageRating: currentStory?.averageRating,
      commentCount: currentStory?.commentCount,
      ratingCount: currentStory?.ratingCount,
    }));

    // Test 2: Force set views to 100
    console.log("[TEST FIELD UPDATE] Setting views to 100...");
    const updateResult = await Story.findOneAndUpdate(
      { storyId },
      { $set: { views: 100 } },
      { new: true }
    );
    console.log("[TEST FIELD UPDATE] After setting views to 100:", updateResult?.views);
    console.log("[TEST FIELD UPDATE] After setting - viewCount:", updateResult?.viewCount);

    // Test 3: Try setting viewCount to 200
    console.log("[TEST FIELD UPDATE] Setting viewCount to 200...");
    const updateResult2 = await Story.findOneAndUpdate(
      { storyId },
      { $set: { viewCount: 200 } },
      { new: true }
    );
    console.log("[TEST FIELD UPDATE] After setting viewCount to 200:", updateResult2?.viewCount);
    console.log("[TEST FIELD UPDATE] After setting viewCount - views:", updateResult2?.views);

    // Test 4: Read the story again
    const finalStory = await Story.findOne({ storyId });
    console.log("[TEST FIELD UPDATE] Final views:", finalStory?.views);
    console.log("[TEST FIELD UPDATE] Final viewCount:", finalStory?.viewCount);

    return res.status(200).json({
      success: true,
      message: "Field test completed",
      results: {
        initialViews: currentStory?.views,
        initialViewCount: currentStory?.viewCount,
        afterSetViews: updateResult?.views,
        afterSetViewCount: updateResult?.viewCount,
        afterSetViewCount2: updateResult2?.viewCount,
        finalViews: finalStory?.views,
        finalViewCount: finalStory?.viewCount,
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
