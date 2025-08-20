import { connectToDatabase } from "../../../lib/mongodb.js";
import { Story } from "../../../models/index.js";

// Story View Tracking API
export default async function handler(req, res) {
  const { id } = req.query || {};
  console.log(`[STORY VIEW API] ${req.method} /api/stories/${id}/view`);

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
    const { userId, sessionId } = req.body;
    console.log(`[STORY VIEW API] Recording view for story ${id} by user ${userId || sessionId || 'anonymous'}`);

    // Record the view in persistent storage
    const updatedStats = await recordView(id, userId, sessionId);

    console.log(`[STORY VIEW API] ✅ View recorded for story ${id}. New view count: ${updatedStats.viewCount}`);

    return res.status(200).json({
      success: true,
      message: "View recorded successfully",
      storyId: id,
      newViewCount: updatedStats.viewCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[STORY VIEW API] ❌ Error for story ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to record view",
      error: error.message,
    });
  }
}
