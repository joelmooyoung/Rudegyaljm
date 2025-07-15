import { db } from "../../../lib/supabase.js";

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
    switch (req.method) {
      case "GET":
        return await handleGetRatings(req, res, storyId);
      case "POST":
        return await handleCreateRating(req, res, storyId);
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
