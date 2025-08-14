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
    
    console.log(`[STORY LIKE API] User ${userId} ${action}d story ${id}`);
    
    // In development, just simulate success
    // In production with database, this would record the like/unlike
    
    const newLikeCount = Math.floor(Math.random() * 50) + 5;
    
    return res.status(200).json({
      success: true,
      message: `Story ${action}d successfully`,
      storyId: id,
      userId: userId,
      action: action,
      newLikeCount: newLikeCount,
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
