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
    const { userId, rating } = req.body; // rating: 1-5

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    console.log(
      `[STORY RATING API] User ${userId} rated story ${id} with ${rating} stars`,
    );

    // In development, just simulate success
    // In production with database, this would record the rating

    const newAverageRating = parseFloat((Math.random() * 2 + 3).toFixed(1)); // 3.0 - 5.0
    const newRatingCount = Math.floor(Math.random() * 20) + 3;

    return res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      storyId: id,
      userId: userId,
      userRating: rating,
      newAverageRating: newAverageRating,
      newRatingCount: newRatingCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[STORY RATING API] ❌ Error for story ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit rating",
      error: error.message,
    });
  }
}
