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
    console.log(`[STORY STATS API] Getting stats for story ${id}`);

    // In development, return mock stats
    // In production with database, this would query actual stats

    return res.status(200).json({
      success: true,
      stats: {
        viewCount: Math.floor(Math.random() * 1000) + 100,
        likeCount: Math.floor(Math.random() * 50) + 5,
        rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
        ratingCount: Math.floor(Math.random() * 20) + 3,
        commentCount: Math.floor(Math.random() * 15) + 1,
      },
      storyId: id,
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
