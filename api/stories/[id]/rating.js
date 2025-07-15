// Story rating API with MongoDB integration
import { connectToDatabase } from "../../../lib/mongodb.js";
import { Rating, Story } from "../../../models/index.js";

// Calculate average rating for a story
async function calculateAverageRating(storyId) {
  const ratings = await Rating.find({ storyId });
  if (ratings.length === 0) return { average: 0, count: 0 };

  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / ratings.length;

  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal
    count: ratings.length,
  };
}

export default async function handler(req, res) {
  const { id: storyId } = req.query;

  console.log(`[RATING API] ${req.method} /api/stories/${storyId}/rating`);
  console.log(`[RATING API] Body:`, req.body);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    switch (req.method) {
      case "GET":
        // Get rating stats for story
        console.log(`[RATING API] Getting ratings for story ${storyId}`);

        const stats = await calculateAverageRating(storyId);

        return res.status(200).json({
          success: true,
          data: {
            storyId,
            averageRating: stats.average,
            ratingCount: stats.count,
          },
          timestamp: new Date().toISOString(),
        });

      case "POST":
        // Add/update rating
        const { userId, rating, score } = req.body;

        // Accept either 'rating' or 'score' field for frontend compatibility
        const ratingValue = rating || score;

        console.log(`[RATING API] Request body:`, req.body);
        console.log(`[RATING API] Extracted values:`, { userId, ratingValue });

        if (!userId || !ratingValue || ratingValue < 1 || ratingValue > 5) {
          console.log(`[RATING API] Invalid rating data:`, {
            userId,
            ratingValue,
          });
          return res.status(400).json({
            success: false,
            message: "Valid userId and rating/score (1-5) are required",
            received: { userId, rating, score, ratingValue },
          });
        }

        console.log(
          `[RATING API] User ${userId} rating story ${storyId}: ${ratingValue}`,
        );

        // Check if user already rated this story
        const existingRating = await Rating.findOne({ storyId, userId });

        if (existingRating) {
          // Update existing rating
          existingRating.rating = ratingValue;
          await existingRating.save();
          console.log(
            `[RATING API] ✅ Updated rating for story ${storyId} to ${ratingValue}`,
          );
        } else {
          // Add new rating
          const ratingId = Date.now().toString();
          const newRating = new Rating({
            ratingId,
            storyId,
            userId,
            rating: ratingValue,
          });
          await newRating.save();
          console.log(
            `[RATING API] ✅ Added new rating for story ${storyId}: ${ratingValue}`,
          );
        }

        // Recalculate story average rating
        const newStats = await calculateAverageRating(storyId);

        // Update story document with new rating stats
        await Story.findOneAndUpdate(
          { storyId },
          {
            averageRating: newStats.average,
            ratingCount: newStats.count,
          },
        );

        return res.status(200).json({
          success: true,
          message: "Rating saved successfully",
          data: {
            storyId,
            userRating: ratingValue,
            averageRating: newStats.average,
            ratingCount: newStats.count,
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
    console.error(`[RATING API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
