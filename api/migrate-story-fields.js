import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[MIGRATE FIELDS] ${req.method} /api/migrate-story-fields`);

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
    console.log("[MIGRATE FIELDS] Connected to database");

    // Get all stories to examine and migrate
    const allStories = await Story.find({});
    console.log(`[MIGRATE FIELDS] Found ${allStories.length} stories to migrate`);

    let migratedCount = 0;
    const migrationLog = [];

    for (const story of allStories) {
      const storyData = story.toObject();
      const updates = {};
      let needsUpdate = false;
      const changes = [];

      // Migration Rule 1: viewCount → views (take the higher value)
      if (storyData.viewCount !== undefined) {
        const oldViews = storyData.views || 0;
        const legacyViewCount = storyData.viewCount || 0;
        const finalViews = Math.max(oldViews, legacyViewCount);
        
        if (finalViews !== oldViews) {
          updates.views = finalViews;
          needsUpdate = true;
          changes.push(`views: ${oldViews} → ${finalViews} (merged from viewCount: ${legacyViewCount})`);
        }
        
        // Remove the old field
        updates.$unset = updates.$unset || {};
        updates.$unset.viewCount = "";
        needsUpdate = true;
        changes.push(`removed viewCount field`);
      }

      // Migration Rule 2: rating → averageRating (take the higher value)
      if (storyData.rating !== undefined) {
        const oldRating = storyData.averageRating || 0;
        const legacyRating = storyData.rating || 0;
        const finalRating = Math.max(oldRating, legacyRating);
        
        if (finalRating !== oldRating) {
          updates.averageRating = finalRating;
          needsUpdate = true;
          changes.push(`averageRating: ${oldRating} → ${finalRating} (merged from rating: ${legacyRating})`);
        }
        
        // Remove the old field
        updates.$unset = updates.$unset || {};
        updates.$unset.rating = "";
        needsUpdate = true;
        changes.push(`removed rating field`);
      }

      // Migration Rule 3: Ensure all stat fields exist and are numbers
      const statFields = ['views', 'likeCount', 'averageRating', 'commentCount', 'ratingCount'];
      
      for (const field of statFields) {
        if (storyData[field] === undefined || storyData[field] === null || typeof storyData[field] !== 'number') {
          updates[field] = 0;
          needsUpdate = true;
          changes.push(`initialized ${field} to 0`);
        }
      }

      // Apply updates if needed
      if (needsUpdate) {
        const updateOperation = {};
        
        // Separate $set and $unset operations
        if (updates.$unset) {
          updateOperation.$unset = updates.$unset;
          delete updates.$unset;
        }
        
        if (Object.keys(updates).length > 0) {
          updateOperation.$set = updates;
        }

        await Story.findOneAndUpdate(
          { storyId: story.storyId },
          updateOperation
        );

        migratedCount++;
        const logEntry = {
          storyId: story.storyId,
          title: story.title,
          changes: changes
        };
        migrationLog.push(logEntry);
        
        console.log(`[MIGRATE FIELDS] Migrated story ${story.storyId}: ${changes.join(', ')}`);
      }
    }

    // Verify migration by checking a sample story
    const sampleStory = await Story.findOne({ storyId: "1755540821501" });
    const verification = {
      storyId: sampleStory?.storyId,
      views: sampleStory?.views,
      likeCount: sampleStory?.likeCount,
      averageRating: sampleStory?.averageRating,
      commentCount: sampleStory?.commentCount,
      ratingCount: sampleStory?.ratingCount,
      // Check that old fields are gone
      hasOldViewCount: sampleStory?.viewCount !== undefined,
      hasOldRating: sampleStory?.rating !== undefined,
    };

    console.log(`[MIGRATE FIELDS] Migration completed. Migrated ${migratedCount} stories.`);

    return res.status(200).json({
      success: true,
      message: "Field migration completed",
      results: {
        totalStories: allStories.length,
        migratedCount: migratedCount,
        verification: verification,
        migrationLog: migrationLog.slice(0, 5), // Show first 5 for brevity
        allMigrations: migrationLog.length
      }
    });

  } catch (error) {
    console.error("[MIGRATE FIELDS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message,
    });
  }
}
