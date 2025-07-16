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
        // Get rating stats for story
        console.log(`[RATING API] Getting ratings for story ${storyId}`);

        const ratings = await db.getRatings(storyId);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        return res.status(200).json({
          success: true,
          data: {
            storyId,
            averageRating: Math.round(averageRating * 10) / 10,
            ratingCount: ratings.length,
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

        await db.upsertRating(storyId, userId, ratingValue);

        // Get updated stats
        const updatedRatings = await db.getRatings(storyId);
        const newAverageRating =
          updatedRatings.length > 0
            ? updatedRatings.reduce((sum, r) => sum + r.rating, 0) /
              updatedRatings.length
            : 0;

        console.log(
          `[RATING API] ✅ Rating saved for story ${storyId}: ${ratingValue}`,
        );

        return res.status(200).json({
          success: true,
          message: "Rating saved successfully",
          data: {
            storyId,
            userRating: ratingValue,
            averageRating: Math.round(newAverageRating * 10) / 10,
            ratingCount: updatedRatings.length,
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
