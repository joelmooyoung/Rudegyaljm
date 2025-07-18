// Get current story statistics
import { connectToDatabase } from "../../../lib/mongodb.js";
import { Story, Like, Comment, Rating } from "../../../models/index.js";

export default async function handler(req, res) {
  const { id: storyId } = req.query;

  console.log(`[STORY STATS API] ${req.method} /api/stories/${storyId}/stats`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    await connectToDatabase();

    // Get story from database
    const story = await Story.findOne({ storyId });
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Get actual counts from related collections to ensure accuracy
    const [likeCount, commentCount, ratingCount] = await Promise.all([
      Like.countDocuments({ storyId }),
      Comment.countDocuments({ storyId }),
      Rating.countDocuments({ storyId }),
    ]);

    // Calculate average rating
    const ratings = await Rating.find({ storyId });
    let averageRating = 0;
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      averageRating = Math.round((sum / ratings.length) * 10) / 10;
    }

    const stats = {
      storyId,
      viewCount: story.views || 0,
      likeCount,
      commentCount,
      averageRating,
      ratingCount,
      totalComments: commentCount, // Alias for compatibility
      totalRatings: ratingCount, // Alias for compatibility
    };

    console.log(
      `[STORY STATS API] ✅ Retrieved stats for story ${storyId}:`,
      stats,
    );

    return res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[STORY STATS API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
