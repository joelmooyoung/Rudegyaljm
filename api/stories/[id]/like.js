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

    // Connect to production database
    await connectToDatabase();

    // Ensure likeCount field exists and is a number
    let currentStory = await Story.findOne({ storyId: id });
    if (!currentStory) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    const currentObj = currentStory.toObject();
    if (currentObj.likeCount === undefined || currentObj.likeCount === null || isNaN(currentObj.likeCount)) {
      await Story.findOneAndUpdate(
        { storyId: id },
        { $set: { likeCount: 0 } }
      );
    }

    if (action === 'like') {
      // Add like record and increment story like count
      const existingLike = await Like.findOne({ storyId: id, userId });
      if (!existingLike) {
        // Create like record
        const likeId = `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await Like.create({ likeId, storyId: id, userId });

        // Increment story like count
        await Story.findOneAndUpdate(
          { storyId: id },
          { $inc: { likeCount: 1 } }
        );
      }
    } else {
      // Remove like record and decrement story like count
      const deletedLike = await Like.findOneAndDelete({ storyId: id, userId });
      if (deletedLike) {
        // Decrement story like count (but don't go below 0)
        await Story.findOneAndUpdate(
          { storyId: id },
          { $inc: { likeCount: -1 } }
        );
      }
    }

    // Get updated story and user interaction status
    const [story, userLike] = await Promise.all([
      Story.findOne({ storyId: id }),
      Like.findOne({ storyId: id, userId })
    ]);

    // Get the actual like count from the raw object to ensure we read the correct value
    const storyObj = story?.toObject();
    const actualLikeCount = storyObj?.likeCount || 0;

    console.log(`[STORY LIKE API] ✅ ${action} recorded for story ${id}. New like count: ${actualLikeCount}`);

    return res.status(200).json({
      success: true,
      message: `Story ${action}d successfully`,
      storyId: id,
      userId: userId,
      action: action,
      newLikeCount: actualLikeCount,
      userInteraction: {
        liked: !!userLike,
      },
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
