import { connectToDatabase } from "../../lib/mongodb.js";
import { Story } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[REVERT STATS API] ${req.method} /api/admin/revert-stats-migration`);

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
    console.log("[REVERT STATS API] Starting stats revert...");

    await connectToDatabase();

    // Get all stories with current stats
    const stories = await Story.find({});
    console.log(`[REVERT STATS API] Found ${stories.length} stories to potentially revert`);

    const revertResults = {
      totalStories: stories.length,
      reverted: 0,
      skipped: 0,
      errors: 0,
      changes: [],
    };

    for (const story of stories) {
      try {
        const storyObj = story.toObject();
        const currentViews = storyObj.views || 0;
        const currentLikes = storyObj.likeCount || 0;
        const currentRatings = storyObj.ratingCount || 0;

        // Check if this story looks like it was migrated (likes and ratings match views)
        const wasMigrated = currentLikes === currentViews && currentRatings === currentViews;

        if (wasMigrated && currentViews >= 454) {
          // Likely migrated story - reset to more realistic values
          const newViews = Math.floor(Math.random() * 100) + 20; // Random 20-120
          const newLikes = Math.floor(newViews * 0.1); // 10% of views
          const newRatings = Math.floor(newViews * 0.05); // 5% of views

          await Story.updateOne(
            { storyId: story.storyId },
            {
              $set: {
                views: newViews,
                likeCount: newLikes,
                ratingCount: newRatings,
                updatedAt: new Date(),
              },
            }
          );

          revertResults.reverted++;
          revertResults.changes.push({
            storyId: story.storyId,
            title: story.title?.substring(0, 50) + "...",
            before: {
              views: currentViews,
              likes: currentLikes,
              ratings: currentRatings,
            },
            after: {
              views: newViews,
              likes: newLikes,
              ratings: newRatings,
            },
          });

          console.log(`[REVERT STATS API] ✅ Reverted story ${story.storyId}: views ${currentViews}→${newViews}, likes ${currentLikes}→${newLikes}, ratings ${currentRatings}→${newRatings}`);
        } else {
          revertResults.skipped++;
          console.log(`[REVERT STATS API] ⏭️ Skipped story ${story.storyId}: doesn't look migrated`);
        }
      } catch (storyError) {
        revertResults.errors++;
        console.error(`[REVERT STATS API] ❌ Error reverting story ${story.storyId}:`, storyError);
      }
    }

    console.log(`[REVERT STATS API] ✅ Revert completed:`, revertResults);

    return res.status(200).json({
      success: true,
      message: "Stats revert completed successfully",
      results: revertResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[REVERT STATS API] ❌ Revert failed:`, error);
    return res.status(500).json({
      success: false,
      message: "Revert failed",
      error: error.message,
    });
  }
}
