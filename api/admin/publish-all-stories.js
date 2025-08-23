// Admin endpoint to mark all stories as published
import { connectToDatabase } from "../../lib/mongodb.js";
import { Story } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[PUBLISH ALL] ${req.method} /api/admin/publish-all-stories`);

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
      message: "Method not allowed. Use POST to publish all stories.",
    });
  }

  try {
    await connectToDatabase();
    console.log("[PUBLISH ALL] Connected to database");

    // Get count of unpublished stories first
    const unpublishedCount = await Story.countDocuments({ published: false });
    console.log(`[PUBLISH ALL] Found ${unpublishedCount} unpublished stories`);

    if (unpublishedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "All stories are already published",
        storiesUpdated: 0,
        totalStories: await Story.countDocuments(),
      });
    }

    // Update all stories to published = true
    const updateResult = await Story.updateMany(
      { published: false },
      {
        $set: {
          published: true,
          updatedAt: new Date(),
        },
      },
    );

    console.log(`[PUBLISH ALL] Update result:`, updateResult);

    // Get final counts for verification
    const totalStories = await Story.countDocuments();
    const publishedStories = await Story.countDocuments({ published: true });

    console.log(
      `[PUBLISH ALL] ✅ Successfully published ${updateResult.modifiedCount} stories`,
    );
    console.log(
      `[PUBLISH ALL] Total stories: ${totalStories}, Published: ${publishedStories}`,
    );

    return res.status(200).json({
      success: true,
      message: `Successfully marked ${updateResult.modifiedCount} stories as published`,
      storiesUpdated: updateResult.modifiedCount,
      totalStories: totalStories,
      publishedStories: publishedStories,
      unpublishedStories: totalStories - publishedStories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[PUBLISH ALL] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish stories",
      error: error.message,
    });
  }
}
