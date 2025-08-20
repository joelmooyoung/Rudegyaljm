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
    console.log(`[STORY STATS API] Getting production stats for story ${id}`);

    // Connect to production database (with connection checking)
    try {
      await connectToDatabase();
    } catch (connectionError) {
      console.warn("[STORY STATS API] Database connection failed:", connectionError.message);
      return res.status(503).json({
        success: false,
        message: "Database temporarily unavailable",
        stats: {
          viewCount: 0,
          likeCount: 0,
          rating: 0,
          ratingCount: 0,
          commentCount: 0,
        },
      });
    }

    // Get story stats from production MongoDB
    const story = await Story.findOne({ storyId: id });

    const storyObj = story.toObject();
    console.log(`[STORY STATS API DEBUG] Story object:`, {
      found: !!story,
      storyId: story?.storyId,
      views: story?.views,
      likeCount: story?.likeCount,
      averageRating: story?.averageRating,
      commentCount: story?.commentCount,
      ratingCount: story?.ratingCount,
      allFields: story ? Object.keys(storyObj) : 'no story',
      rawFieldValues: {
        views: storyObj.views,
        likeCount: storyObj.likeCount,
        averageRating: storyObj.averageRating,
        commentCount: storyObj.commentCount,
        ratingCount: storyObj.ratingCount,
      }
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Get user interaction status if userId provided
    const { userId } = req.query;
    let userInteraction = null;

    if (userId) {
      const [userLike, userRating] = await Promise.all([
        Like.findOne({ storyId: id, userId }),
        Rating.findOne({ storyId: id, userId }),
      ]);

      userInteraction = {
        liked: !!userLike,
        rating: userRating?.rating || 0,
      };
    }

    console.log(`[STORY STATS API] ✅ Production stats for story ${id}:`, {
      views: story.views,
      likes: story.likeCount,
      rating: story.averageRating,
      comments: story.commentCount,
    });

    return res.status(200).json({
      success: true,
      stats: {
        viewCount: story.views || 0,
        likeCount: story.likeCount || 0,
        rating: story.averageRating || 0,
        ratingCount: story.ratingCount || 0,
        commentCount: story.commentCount || 0,
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
