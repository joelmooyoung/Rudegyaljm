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

    // Update ALL stories that have missing or undefined stat fields
    console.log("[FIX ALL STATS] Updating all stories with missing stat fields...");

    const updateResult = await Story.updateMany(
      {}, // Match all stories
      {
        $set: {
          views: { $ifNull: ["$views", 0] },
          likeCount: { $ifNull: ["$likeCount", 0] },
          averageRating: { $ifNull: ["$averageRating", 0] },
          commentCount: { $ifNull: ["$commentCount", 0] },
          ratingCount: { $ifNull: ["$ratingCount", 0] },
        }
      }
    );

    console.log("[FIX ALL STATS] Bulk update result:", {
      acknowledged: updateResult.acknowledged,
      modifiedCount: updateResult.modifiedCount,
      matchedCount: updateResult.matchedCount,
    });

    // Use a different approach - set fields that are null/undefined to 0
    const result2 = await Story.updateMany(
      {
        $or: [
          { views: { $exists: false } },
          { views: null },
          { views: undefined },
          { likeCount: { $exists: false } },
          { likeCount: null },
          { likeCount: undefined },
          { averageRating: { $exists: false } },
          { averageRating: null },
          { averageRating: undefined },
          { commentCount: { $exists: false } },
          { commentCount: null },
          { commentCount: undefined },
          { ratingCount: { $exists: false } },
          { ratingCount: null },
          { ratingCount: undefined },
        ]
      },
      {
        $set: {
          views: 0,
          likeCount: 0,
          averageRating: 0,
          commentCount: 0,
          ratingCount: 0,
        }
      }
    );

    console.log("[FIX ALL STATS] Second update result:", {
      acknowledged: result2.acknowledged,
      modifiedCount: result2.modifiedCount,
      matchedCount: result2.matchedCount,
    });

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
        firstUpdate: {
          modifiedCount: updateResult.modifiedCount,
          matchedCount: updateResult.matchedCount,
        },
        secondUpdate: {
          modifiedCount: result2.modifiedCount,
          matchedCount: result2.matchedCount,
        },
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
