import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[RECREATE STATS] ${req.method} /api/recreate-stat-fields`);

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
    console.log("[RECREATE STATS] Connected to database");

    const results = {
      phase1: await removeProblematicFields(),
      phase2: await recreateCleanFields(),
      phase3: await verifyFieldsWork(),
    };

    console.log("[RECREATE STATS] All phases completed successfully");

    return res.status(200).json({
      success: true,
      message: "Stat fields successfully removed and recreated",
      results: results,
    });
  } catch (error) {
    console.error("[RECREATE STATS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to recreate stat fields",
      error: error.message,
    });
  }
}

async function removeProblematicFields() {
  console.log("[RECREATE STATS] Phase 1: Removing problematic fields...");

  // Remove the fields that are not working: views, likeCount, averageRating
  const removeResult = await Story.updateMany(
    {}, // All documents
    {
      $unset: {
        views: "",
        likeCount: "",
        averageRating: "",
        // Also remove any legacy fields that might interfere
        viewCount: "",
        rating: "",
        isPublished: "",
      },
    },
  );

  console.log(
    `[RECREATE STATS] Removed problematic fields from ${removeResult.modifiedCount} stories`,
  );

  // Verify removal
  const storiesAfterRemoval = await Story.find({}).limit(3);
  const sampleAfterRemoval = storiesAfterRemoval.map((story) => {
    const obj = story.toObject();
    return {
      storyId: obj.storyId,
      title: obj.title,
      hasViews: obj.views !== undefined,
      hasLikeCount: obj.likeCount !== undefined,
      hasAverageRating: obj.averageRating !== undefined,
      hasViewCount: obj.viewCount !== undefined,
      hasRating: obj.rating !== undefined,
      // Keep these working fields
      commentCount: obj.commentCount,
      ratingCount: obj.ratingCount,
    };
  });

  return {
    removedCount: removeResult.modifiedCount,
    verification: sampleAfterRemoval,
  };
}

async function recreateCleanFields() {
  console.log("[RECREATE STATS] Phase 2: Recreating clean fields...");

  // Add back the fields with clean initialization
  const recreateResult = await Story.updateMany(
    {}, // All documents
    {
      $set: {
        viewCount: 0, // Use viewCount (expected by frontend)
        likeCount: 0, // Keep likeCount name
        rating: 0.0, // Use rating (expected by frontend)
      },
    },
  );

  console.log(
    `[RECREATE STATS] Recreated clean fields in ${recreateResult.modifiedCount} stories`,
  );

  // Verify recreation
  const storiesAfterRecreation = await Story.find({}).limit(3);
  const sampleAfterRecreation = storiesAfterRecreation.map((story) => {
    const obj = story.toObject();
    return {
      storyId: obj.storyId,
      title: obj.title,
      viewCount: obj.viewCount,
      likeCount: obj.likeCount,
      rating: obj.rating,
      commentCount: obj.commentCount,
      ratingCount: obj.ratingCount,
    };
  });

  return {
    recreatedCount: recreateResult.modifiedCount,
    verification: sampleAfterRecreation,
  };
}

async function verifyFieldsWork() {
  console.log("[RECREATE STATS] Phase 3: Testing field operations...");

  // Test with the Amsterdam story
  const testStoryId = "1755540821501";

  // Test 1: Set initial values
  await Story.findOneAndUpdate(
    { storyId: testStoryId },
    {
      $set: {
        viewCount: 100,
        likeCount: 50,
        rating: 4.5,
      },
    },
  );

  const afterSet = await Story.findOne({ storyId: testStoryId });
  const afterSetObj = afterSet.toObject();

  // Test 2: Increment values
  await Story.findOneAndUpdate(
    { storyId: testStoryId },
    {
      $inc: {
        viewCount: 5,
        likeCount: 3,
      },
      $set: {
        rating: 4.7,
      },
    },
  );

  const afterIncrement = await Story.findOne({ storyId: testStoryId });
  const afterIncrementObj = afterIncrement.toObject();

  return {
    testStoryId: testStoryId,
    afterSet: {
      viewCount: afterSetObj.viewCount,
      likeCount: afterSetObj.likeCount,
      rating: afterSetObj.rating,
    },
    afterIncrement: {
      viewCount: afterIncrementObj.viewCount,
      likeCount: afterIncrementObj.likeCount,
      rating: afterIncrementObj.rating,
    },
    operationsWork: {
      setWorked:
        afterSetObj.viewCount === 100 &&
        afterSetObj.likeCount === 50 &&
        afterSetObj.rating === 4.5,
      incrementWorked:
        afterIncrementObj.viewCount === 105 &&
        afterIncrementObj.likeCount === 53 &&
        afterIncrementObj.rating === 4.7,
    },
  };
}
