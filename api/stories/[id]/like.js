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
        // Get like count and user's like status
        console.log(`[LIKES API] Getting likes for story ${storyId}`);

        const likes = await db.getLikes(storyId);
        const userLike = await db.getUserLike(storyId, userId);
        const userLiked = !!userLike;

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

      case "POST":
        // Add like (toggle like/unlike)
        console.log(
          `[LIKES API] User ${userId} toggling like for story ${storyId}`,
        );
        console.log(`[LIKES API] Request body:`, req.body);

        const result = await db.toggleLike(storyId, userId);
        const likes = await db.getLikes(storyId);
        const likeCount = likes.length;

        console.log(
          `[LIKES API] ✅ ${result.liked ? "LIKED" : "UNLIKED"} story ${storyId} - new count: ${likeCount}`,
        );

        return res.status(result.liked ? 201 : 200).json({
          success: true,
          message: result.liked ? "Story liked" : "Story unliked",
          liked: result.liked, // Direct field for frontend compatibility
          likeCount,
          data: {
            storyId,
            liked: result.liked,
            likeCount,
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[LIKES API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
