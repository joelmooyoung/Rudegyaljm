<<<<<<< HEAD
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
=======
import { db } from "../../../lib/supabase.js";
>>>>>>> 5a56b8ea6e425b9ec097296fbb24a05ee5163ac4

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
<<<<<<< HEAD
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

=======
        return await handleGetRatings(req, res, storyId);
      case "POST":
        return await handleCreateRating(req, res, storyId);
>>>>>>> 5a56b8ea6e425b9ec097296fbb24a05ee5163ac4
      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[RATING API] Error:`, error);

    // Log error to database
    try {
      await db.logError({
        error_type: "RATING_API_ERROR",
        error_message: error.message,
        stack_trace: error.stack,
        request_path: `/api/stories/${storyId}/rating`,
      });
    } catch (logError) {
      console.error(`[RATING API] Failed to log error:`, logError);
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function handleGetRatings(req, res, storyId) {
  console.log(`[RATING API] Getting ratings for story ${storyId}`);

  const ratings = await db.getRatings(storyId);

  // Calculate average rating
  let averageRating = 0;
  if (ratings.length > 0) {
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    averageRating = Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
  }

  return res.status(200).json({
    success: true,
    data: {
      storyId,
      averageRating,
      ratingCount: ratings.length,
    },
    timestamp: new Date().toISOString(),
  });
}

async function handleCreateRating(req, res, storyId) {
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

  // Upsert rating (insert or update)
  const savedRating = await db.upsertRating(storyId, userId, ratingValue);

  console.log(
    `[RATING API] ✅ Saved rating for story ${storyId}: ${ratingValue}`,
  );

  // Get updated stats
  const ratings = await db.getRatings(storyId);
  let averageRating = 0;
  if (ratings.length > 0) {
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    averageRating = Math.round((sum / ratings.length) * 10) / 10;
  }

  return res.status(200).json({
    success: true,
    message: "Rating saved successfully",
    data: {
      storyId,
      userRating: ratingValue,
      averageRating,
      ratingCount: ratings.length,
    },
    timestamp: new Date().toISOString(),
  });
}
