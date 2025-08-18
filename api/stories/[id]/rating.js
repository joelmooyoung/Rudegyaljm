import { recordRating, getUserInteractionStatus } from "../../../lib/story-stats.js";

// Story Rating API
export default async function handler(req, res) {
  const { id } = req.query || {};
  console.log(`[STORY RATING API] ${req.method} /api/stories/${id}/rating`);

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
    const { userId, rating } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    console.log(`[STORY RATING API] User ${userId} rated story ${id} with ${rating} stars`);

    // Record the rating in persistent storage
    const updatedStats = await recordRating(id, userId, rating);

    // Get updated user interaction status
    const userInteraction = await getUserInteractionStatus(id, userId);

    console.log(`[STORY RATING API] ✅ Rating recorded for story ${id}. New average: ${updatedStats.rating} (${updatedStats.ratingCount} ratings)`);

    return res.status(200).json({
      success: true,
      message: "Rating recorded successfully",
      storyId: id,
      userId: userId,
      rating: rating,
      newAverageRating: updatedStats.rating,
      newRatingCount: updatedStats.ratingCount,
      userInteraction: userInteraction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[STORY RATING API] ❌ Error for story ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to record rating",
      error: error.message,
    });
  }
}
