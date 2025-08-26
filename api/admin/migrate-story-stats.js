import { connectToDatabase } from "../../lib/mongodb.js";
import { Story } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[STATS MIGRATION API] ${req.method} /api/admin/migrate-story-stats`);

  // Enable CORS and set content type
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

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
    console.log("[STATS MIGRATION API] Starting one-time stats migration...");

    try {
      await connectToDatabase();
      console.log("[STATS MIGRATION API] Database connected successfully");
    } catch (dbError) {
      console.error("[STATS MIGRATION API] Database connection failed:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: dbError.message,
      });
    }

    // Get all stories
    const stories = await Story.find({});
    console.log(`[STATS MIGRATION API] Found ${stories.length} stories to process`);

    const migrationResults = {
      totalStories: stories.length,
      updated: 0,
      skipped: 0,
      errors: 0,
      changes: [],
      summary: {},
    };

    for (const story of stories) {
      try {
        const storyObj = story.toObject();
        const currentViews = storyObj.views || 0;
        const currentLikes = storyObj.likeCount || 0;
        const currentRatings = storyObj.ratingCount || 0;

        // Determine new values
        let newViews = currentViews;
        if (currentViews < 100) {
          newViews = 454;
        }

        const newLikes = newViews;
        const newRatings = newViews;

        // Check if update is needed
        const needsUpdate = 
          newViews !== currentViews || 
          newLikes !== currentLikes || 
          newRatings !== currentRatings;

        if (needsUpdate) {
          // Update the story
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

          migrationResults.updated++;
          migrationResults.changes.push({
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

          console.log(`[STATS MIGRATION API] ✅ Updated story ${story.storyId}: views ${currentViews}→${newViews}, likes ${currentLikes}→${newLikes}, ratings ${currentRatings}→${newRatings}`);
        } else {
          migrationResults.skipped++;
          console.log(`[STATS MIGRATION API] ⏭️ Skipped story ${story.storyId}: no changes needed`);
        }
      } catch (storyError) {
        migrationResults.errors++;
        console.error(`[STATS MIGRATION API] ❌ Error updating story ${story.storyId}:`, storyError);
      }
    }

    // Generate summary
    migrationResults.summary = {
      totalProcessed: migrationResults.totalStories,
      successfulUpdates: migrationResults.updated,
      skippedNoChanges: migrationResults.skipped,
      errors: migrationResults.errors,
      viewsSetTo454: migrationResults.changes.filter(c => c.after.views === 454).length,
      averageNewViews: migrationResults.changes.length > 0 
        ? Math.round(migrationResults.changes.reduce((sum, c) => sum + c.after.views, 0) / migrationResults.changes.length)
        : 0,
    };

    console.log(`[STATS MIGRATION API] ✅ Migration completed:`, migrationResults.summary);

    return res.status(200).json({
      success: true,
      message: "Stats migration completed successfully",
      results: migrationResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[STATS MIGRATION API] ❌ Migration failed:`, error);
    return res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message,
    });
  }
}
