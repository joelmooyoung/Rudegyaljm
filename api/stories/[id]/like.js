import { connectToDatabase } from "../../../lib/mongodb.js";
import { Story, Like } from "../../../models/index.js";

// Story Like API
export default async function handler(req, res) {
  const { id } = req.query || {};
  console.log(`[STORY LIKE API] ${req.method} /api/stories/${id}/like`);

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
    const { userId, action } = req.body; // action: 'like' or 'unlike'

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!action || !['like', 'unlike'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'like' or 'unlike'",
      });
    }

    console.log(`[STORY LIKE API] User ${userId} ${action}d story ${id}`);

    // Record the like/unlike in persistent storage
    const updatedStats = await recordLike(id, userId, action);

    // Get updated user interaction status
    const userInteraction = await getUserInteractionStatus(id, userId);

    console.log(`[STORY LIKE API] ✅ ${action} recorded for story ${id}. New like count: ${updatedStats.likeCount}`);

    return res.status(200).json({
      success: true,
      message: `Story ${action}d successfully`,
      storyId: id,
      userId: userId,
      action: action,
      newLikeCount: updatedStats.likeCount,
      userInteraction: userInteraction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[STORY LIKE API] ❌ Error for story ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to process like",
      error: error.message,
    });
  }
}
