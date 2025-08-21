import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[TEST DB OPS] ${req.method} /api/test-database-operations`);

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
    console.log("[TEST DB OPS] Connected to database");

    const storyId = "1755540821501";
    const testResults = {};

    // Test 1: Read current state
    const currentStory = await Story.findOne({ storyId });
    const currentObj = currentStory.toObject();

    testResults.initial = {
      views: currentObj.views,
      likeCount: currentObj.likeCount,
      averageRating: currentObj.averageRating,
      commentCount: currentObj.commentCount,
      ratingCount: currentObj.ratingCount,
    };

    console.log("[TEST DB OPS] Initial state:", testResults.initial);

    // Test 2: Force set all fields to specific values
    await Story.findOneAndUpdate(
      { storyId },
      {
        $set: {
          views: 100,
          likeCount: 50,
          averageRating: 4.5,
          commentCount: 25,
          ratingCount: 30,
        },
      },
    );

    const afterSet = await Story.findOne({ storyId });
    const afterSetObj = afterSet.toObject();

    testResults.afterSet = {
      views: afterSetObj.views,
      likeCount: afterSetObj.likeCount,
      averageRating: afterSetObj.averageRating,
      commentCount: afterSetObj.commentCount,
      ratingCount: afterSetObj.ratingCount,
    };

    console.log("[TEST DB OPS] After setting values:", testResults.afterSet);

    // Test 3: Test increment operations
    await Story.findOneAndUpdate(
      { storyId },
      {
        $inc: {
          views: 1,
          likeCount: 1,
          ratingCount: 1,
        },
      },
    );

    const afterIncrement = await Story.findOne({ storyId });
    const afterIncrementObj = afterIncrement.toObject();

    testResults.afterIncrement = {
      views: afterIncrementObj.views,
      likeCount: afterIncrementObj.likeCount,
      averageRating: afterIncrementObj.averageRating,
      commentCount: afterIncrementObj.commentCount,
      ratingCount: afterIncrementObj.ratingCount,
    };

    console.log("[TEST DB OPS] After increment:", testResults.afterIncrement);

    // Test 4: Test average rating calculation
    await Story.findOneAndUpdate(
      { storyId },
      {
        $set: {
          averageRating: 4.7,
        },
      },
    );

    const afterRatingUpdate = await Story.findOne({ storyId });
    const afterRatingObj = afterRatingUpdate.toObject();

    testResults.afterRatingUpdate = {
      views: afterRatingObj.views,
      likeCount: afterRatingObj.likeCount,
      averageRating: afterRatingObj.averageRating,
      commentCount: afterRatingObj.commentCount,
      ratingCount: afterRatingObj.ratingCount,
    };

    console.log(
      "[TEST DB OPS] After rating update:",
      testResults.afterRatingUpdate,
    );

    return res.status(200).json({
      success: true,
      message: "Database operations test completed",
      testResults: testResults,
      summary: {
        setOperationsWork: testResults.afterSet.views === 100,
        incrementOperationsWork: testResults.afterIncrement.views === 101,
        ratingUpdateWorks: testResults.afterRatingUpdate.averageRating === 4.7,
      },
    });
  } catch (error) {
    console.error("[TEST DB OPS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Database operations test failed",
      error: error.message,
    });
  }
}
