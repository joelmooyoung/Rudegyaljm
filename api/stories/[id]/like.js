// Story likes API - handle liking and unliking stories
let likes = [
  { id: "1", storyId: "1", userId: "admin1", createdAt: new Date() },
  { id: "2", storyId: "1", userId: "premium1", createdAt: new Date() },
  { id: "3", storyId: "2", userId: "free1", createdAt: new Date() },
];

let likeCounts = {
  1: 2,
  2: 1,
  3: 0,
};

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
        const count = likeCounts[storyId] || 0;
        const userLiked = likes.some(
          (like) => like.storyId === storyId && like.userId === userId,
        );

        return res.status(200).json({
          success: true,
          data: {
            storyId,
            likeCount: count,
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

        const existingLikeIndex = likes.findIndex(
          (like) => like.storyId === storyId && like.userId === userId,
        );

        if (existingLikeIndex >= 0) {
          // Unlike - remove existing like
          likes.splice(existingLikeIndex, 1);
          likeCounts[storyId] = Math.max(0, (likeCounts[storyId] || 1) - 1);
          console.log(
            `[LIKES API] ✅ UNLIKED story ${storyId} - new count: ${likeCounts[storyId]}`,
          );

          return res.status(200).json({
            success: true,
            message: "Story unliked",
            liked: false, // Direct field for frontend compatibility
            likeCount: likeCounts[storyId],
            data: {
              storyId,
              liked: false,
              likeCount: likeCounts[storyId],
            },
            timestamp: new Date().toISOString(),
          });
        } else {
          // Like - add new like
          const newLike = {
            id: Date.now().toString(),
            storyId,
            userId,
            createdAt: new Date(),
          };

          likes.push(newLike);
          likeCounts[storyId] = (likeCounts[storyId] || 0) + 1;
          console.log(
            `[LIKES API] ✅ LIKED story ${storyId} - new count: ${likeCounts[storyId]}`,
          );

          return res.status(201).json({
            success: true,
            message: "Story liked",
            liked: true, // Direct field for frontend compatibility
            likeCount: likeCounts[storyId],
            data: {
              storyId,
              liked: true,
              likeCount: likeCounts[storyId],
            },
            timestamp: new Date().toISOString(),
          });
        }

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
