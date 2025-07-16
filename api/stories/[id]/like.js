// Story likes API with MongoDB integration
import { connectToDatabase } from "../../../lib/mongodb.js";
import { Like, Story } from "../../../models/index.js";

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
    await connectToDatabase();

    const userId = req.body?.userId || "anonymous";

    switch (req.method) {
      case "GET":
        // Get like count and user's like status
        console.log(`[LIKES API] Getting likes for story ${storyId}`);

        const likeCount = await Like.countDocuments({ storyId });
        const userLike = await Like.findOne({ storyId, userId });
        const userLiked = !!userLike;

        return res.status(200).json({
          success: true,
          data: {
            storyId,
            likeCount,
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

        const existingLike = await Like.findOne({ storyId, userId });

        if (existingLike) {
          // Unlike - remove existing like
          await Like.deleteOne({ _id: existingLike._id });

          // Update story like count
          await Story.findOneAndUpdate(
            { storyId },
            { $inc: { likeCount: -1 } },
          );

          const newLikeCount = await Like.countDocuments({ storyId });
          console.log(
            `[LIKES API] ✅ UNLIKED story ${storyId} - new count: ${newLikeCount}`,
          );

          return res.status(200).json({
            success: true,
            message: "Story unliked",
            liked: false, // Direct field for frontend compatibility
            likeCount: newLikeCount,
            data: {
              storyId,
              liked: false,
              likeCount: newLikeCount,
            },
            timestamp: new Date().toISOString(),
          });
        } else {
          // Like - add new like
          const likeId = Date.now().toString();
          const newLike = new Like({
            likeId,
            storyId,
            userId,
          });

          await newLike.save();

          // Update story like count
          await Story.findOneAndUpdate({ storyId }, { $inc: { likeCount: 1 } });

          const newLikeCount = await Like.countDocuments({ storyId });
          console.log(
            `[LIKES API] ✅ LIKED story ${storyId} - new count: ${newLikeCount}`,
          );

          return res.status(201).json({
            success: true,
            message: "Story liked",
            liked: true, // Direct field for frontend compatibility
            likeCount: newLikeCount,
            data: {
              storyId,
              liked: true,
              likeCount: newLikeCount,
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
