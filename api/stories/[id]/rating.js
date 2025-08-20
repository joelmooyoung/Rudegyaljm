import { connectToDatabase } from "../../../lib/mongodb.js";
import { Story, Rating } from "../../../models/index.js";

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

    // Connect to production database
    await connectToDatabase();

    // Ensure rating fields exist and are numbers
    await Story.findOneAndUpdate(
      { storyId: id, $or: [
        { averageRating: { $exists: false } },
        { averageRating: null },
        { averageRating: undefined },
        { ratingCount: { $exists: false } },
        { ratingCount: null },
        { ratingCount: undefined }
      ]},
      { $set: { averageRating: 0, ratingCount: 0 } }
    );

    // Update or create rating record
    const ratingId = `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await Rating.findOneAndUpdate(
      { storyId: id, userId },
      { ratingId, storyId: id, userId, rating },
      { upsert: true, new: true }
    );

    // Recalculate story average rating and count
    const ratings = await Rating.find({ storyId: id });
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    // Update story with new rating stats
    const story = await Story.findOneAndUpdate(
      { storyId: id },
      {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingCount: ratings.length
      },
      { new: true }
    );

    // Get user interaction status
    const [userRating, userLike] = await Promise.all([
      Rating.findOne({ storyId: id, userId }),
      null // We'll get this from Like collection if needed
    ]);

    console.log(`[STORY RATING API] ✅ Rating recorded for story ${id}. New average: ${story?.averageRating || 0} (${story?.ratingCount || 0} ratings)`);

    return res.status(200).json({
      success: true,
      message: "Rating recorded successfully",
      storyId: id,
      userId: userId,
      rating: rating,
      newAverageRating: story?.averageRating || 0,
      newRatingCount: story?.ratingCount || 0,
      userInteraction: {
        rating: userRating?.rating || 0,
      },
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
