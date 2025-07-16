// Story stats API - get comprehensive story statistics
export default async function handler(req, res) {
  const { id: storyId } = req.query;

  console.log(`[STATS API] GET /api/stories/${storyId}/stats`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    // Mock stats data - in production this would come from database
    const stats = {
      storyId,
      views: Math.floor(Math.random() * 10000) + 1000,
      likes: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 100) + 10,
      averageRating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      ratingCount: Math.floor(Math.random() * 200) + 20,
      shares: Math.floor(Math.random() * 50) + 5,
      bookmarks: Math.floor(Math.random() * 100) + 15,
    };

    console.log(`[STATS API] ✅ Retrieved stats for story ${storyId}`);

    return res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[STATS API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
