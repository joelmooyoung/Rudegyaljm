import { db } from "../../../lib/supabase.js";

export default async function handler(req, res) {
  const { id: storyId } = req.query;

  console.log(`[LIKES API] ${req.method} /api/stories/${storyId}/like`);
  console.log(`[LIKES API] Body:`, req.body);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const userId = req.body?.userId || "anonymous";

    switch (req.method) {
      case "GET":
        return await handleGetLikes(req, res, storyId, userId);
      case "POST":
        return await handleToggleLike(req, res, storyId, userId);
      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[LIKES API] Error:`, error);

    // Log error to database
    try {
      await db.logError({
        error_type: "LIKES_API_ERROR",
        error_message: error.message,
        stack_trace: error.stack,
        request_path: `/api/stories/${storyId}/like`,
      });
    } catch (logError) {
      console.error(`[LIKES API] Failed to log error:`, logError);
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function handleGetLikes(req, res, storyId, userId) {
  console.log(`[LIKES API] Getting likes for story ${storyId}`);

  const likes = await db.getLikes(storyId);
  const userLiked = likes.some((like) => like.user_id === userId);

  return res.status(200).json({
    success: true,
    data: {
      storyId,
      likeCount: likes.length,
      userLiked,
      userId,
    },
    timestamp: new Date().toISOString(),
  });
}

async function handleToggleLike(req, res, storyId, userId) {
  console.log(`[LIKES API] User ${userId} toggling like for story ${storyId}`);
  console.log(`[LIKES API] Request body:`, req.body);

  const result = await db.toggleLike(storyId, userId);

  // Get updated like count
  const likes = await db.getLikes(storyId);
  const likeCount = likes.length;

  if (result.liked) {
    console.log(
      `[LIKES API] ✅ LIKED story ${storyId} - new count: ${likeCount}`,
    );

    return res.status(201).json({
      success: true,
      message: "Story liked",
      liked: true, // Direct field for frontend compatibility
      likeCount: likeCount,
      data: {
        storyId,
        liked: true,
        likeCount: likeCount,
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    console.log(
      `[LIKES API] ✅ UNLIKED story ${storyId} - new count: ${likeCount}`,
    );

    return res.status(200).json({
      success: true,
      message: "Story unliked",
      liked: false, // Direct field for frontend compatibility
      likeCount: likeCount,
      data: {
        storyId,
        liked: false,
        likeCount: likeCount,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
