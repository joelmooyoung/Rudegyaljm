import { connectToDatabase } from "../../../lib/mongodb.js";
import { Story, Like, Rating } from "../../../models/index.js";

// Story Stats API
export default async function handler(req, res) {
  const { id } = req.query || {};
  console.log(`[STORY STATS API] ${req.method} /api/stories/${id}/stats`);

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
    console.log(`[STORY STATS API] Getting real stats for story ${id}`);

    // Get real stats from storage
    const stats = await getStoryStats(id);

    // Get user interaction status if userId provided
    const { userId } = req.query;
    let userInteraction = null;

    if (userId) {
      userInteraction = await getUserInteractionStatus(id, userId);
    }

    console.log(`[STORY STATS API] ✅ Stats for story ${id}:`, {
      views: stats.viewCount,
      likes: stats.likeCount,
      rating: stats.rating,
      comments: stats.commentCount,
    });

    return res.status(200).json({
      success: true,
      stats: {
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
        rating: stats.rating,
        ratingCount: stats.ratingCount,
        commentCount: stats.commentCount,
      },
      userInteraction,
      storyId: id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[STORY STATS API] ❌ Error for story ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to get stats",
      error: error.message,
    });
  }
}
