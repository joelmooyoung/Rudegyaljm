import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[FIX ALL STATS] ${req.method} /api/fix-all-story-stats`);

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
    console.log("[FIX ALL STATS] Connected to database");

    // Get all stories first
    const allStories = await Story.find({});
    console.log(`[FIX ALL STATS] Found ${allStories.length} total stories`);

    let fixedCount = 0;
    let totalCount = allStories.length;

    // Process each story individually
    for (const story of allStories) {
      const needsUpdate = (
        story.views === undefined || story.views === null ||
        story.likeCount === undefined || story.likeCount === null ||
        story.averageRating === undefined || story.averageRating === null ||
        story.commentCount === undefined || story.commentCount === null ||
        story.ratingCount === undefined || story.ratingCount === null
      );

      if (needsUpdate) {
        const updateFields = {};

        if (story.views === undefined || story.views === null) updateFields.views = 0;
        if (story.likeCount === undefined || story.likeCount === null) updateFields.likeCount = 0;
        if (story.averageRating === undefined || story.averageRating === null) updateFields.averageRating = 0;
        if (story.commentCount === undefined || story.commentCount === null) updateFields.commentCount = 0;
        if (story.ratingCount === undefined || story.ratingCount === null) updateFields.ratingCount = 0;

        await Story.findOneAndUpdate(
          { storyId: story.storyId },
          { $set: updateFields }
        );

        fixedCount++;
        console.log(`[FIX ALL STATS] Fixed story ${story.storyId}: ${JSON.stringify(updateFields)}`);
      }
    }

    console.log(`[FIX ALL STATS] Fixed ${fixedCount} out of ${totalCount} stories`);

    // Get a sample story to verify the fix
    const sampleStory = await Story.findOne({ storyId: "1755540821501" });
    console.log("[FIX ALL STATS] Sample story after fix:", {
      storyId: sampleStory?.storyId,
      views: sampleStory?.views,
      likeCount: sampleStory?.likeCount,
      averageRating: sampleStory?.averageRating,
      commentCount: sampleStory?.commentCount,
      ratingCount: sampleStory?.ratingCount,
    });

    // Get count of stories with proper stat fields
    const properStoryCount = await Story.countDocuments({
      views: { $exists: true, $ne: null },
      likeCount: { $exists: true, $ne: null },
      averageRating: { $exists: true, $ne: null },
      commentCount: { $exists: true, $ne: null },
      ratingCount: { $exists: true, $ne: null },
    });

    const totalStoryCount = await Story.countDocuments({});

    return res.status(200).json({
      success: true,
      message: "All story stats fixed",
      results: {
        totalStories: totalCount,
        fixedCount: fixedCount,
        verification: {
          totalStories: totalStoryCount,
          storiesWithProperStats: properStoryCount,
          sampleStory: {
            storyId: sampleStory?.storyId,
            views: sampleStory?.views,
            likeCount: sampleStory?.likeCount,
            averageRating: sampleStory?.averageRating,
            commentCount: sampleStory?.commentCount,
            ratingCount: sampleStory?.ratingCount,
          }
        }
      }
    });

  } catch (error) {
    console.error("[FIX ALL STATS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fix all stats",
      error: error.message,
    });
  }
}
