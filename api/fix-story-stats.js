import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[FIX STATS] ${req.method} /api/fix-story-stats`);

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
    console.log("[FIX STATS] Connected to database");

    // Get the problematic story
    const storyId = "1755540821501";
    const story = await Story.findOne({ storyId });
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    console.log("[FIX STATS] Current story stats:", {
      views: story.views,
      likeCount: story.likeCount,
      averageRating: story.averageRating,
      commentCount: story.commentCount,
      ratingCount: story.ratingCount,
    });

    // Force set all stat fields to literal numbers
    const updateResult = await Story.findOneAndUpdate(
      { storyId },
      {
        $set: {
          views: 0,
          likeCount: 0,
          averageRating: 0,
          commentCount: 0,
          ratingCount: story.ratingCount || 0,
        }
      },
      { new: true }
    );

    console.log("[FIX STATS] Updated story stats:", {
      views: updateResult.views,
      likeCount: updateResult.likeCount,
      averageRating: updateResult.averageRating,
      commentCount: updateResult.commentCount,
      ratingCount: updateResult.ratingCount,
    });

    return res.status(200).json({
      success: true,
      message: "Story stats fixed",
      before: {
        views: story.views,
        likeCount: story.likeCount,
        averageRating: story.averageRating,
        commentCount: story.commentCount,
        ratingCount: story.ratingCount,
      },
      after: {
        views: updateResult.views,
        likeCount: updateResult.likeCount,
        averageRating: updateResult.averageRating,
        commentCount: updateResult.commentCount,
        ratingCount: updateResult.ratingCount,
      }
    });

  } catch (error) {
    console.error("[FIX STATS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fix stats",
      error: error.message,
    });
  }
}
