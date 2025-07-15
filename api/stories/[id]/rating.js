// Story rating API - handle story ratings
// Global storage simulation (in production, use database)
if (!global.ratings) {
  global.ratings = [
    {
      id: "1",
      storyId: "1",
      userId: "admin1",
      rating: 5,
      createdAt: "2024-01-16T00:00:00.000Z",
    },
    {
      id: "2",
      storyId: "1",
      userId: "premium1",
      rating: 4,
      createdAt: "2024-01-17T00:00:00.000Z",
    },
    {
      id: "3",
      storyId: "2",
      userId: "free1",
      rating: 5,
      createdAt: "2024-01-21T00:00:00.000Z",
    },
  ];
}

let ratings = global.ratings;

// Calculate average ratings
function calculateAverageRating(storyId) {
  const storyRatings = ratings.filter((r) => r.storyId === storyId);
  if (storyRatings.length === 0) return { average: 0, count: 0 };

  const sum = storyRatings.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / storyRatings.length;

  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal
    count: storyRatings.length,
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
    switch (req.method) {
      case "GET":
        // Get rating stats for story
        console.log(`[RATING API] Getting ratings for story ${storyId}`);
        const stats = calculateAverageRating(storyId);

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
        const existingRatingIndex = ratings.findIndex(
          (r) => r.storyId === storyId && r.userId === userId,
        );

        if (existingRatingIndex >= 0) {
          // Update existing rating
          ratings[existingRatingIndex].rating = ratingValue;
          ratings[existingRatingIndex].createdAt = new Date().toISOString();
          console.log(
            `[RATING API] ✅ Updated rating for story ${storyId} to ${ratingValue}`,
          );
        } else {
          // Add new rating
          const newRating = {
            id: Date.now().toString(),
            storyId,
            userId,
            rating: ratingValue,
            createdAt: new Date().toISOString(),
          };
          ratings.push(newRating);
          console.log(
            `[RATING API] ✅ Added new rating for story ${storyId}: ${ratingValue}`,
          );
        }

        const newStats = calculateAverageRating(storyId);

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
