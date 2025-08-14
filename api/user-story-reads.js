// User Story Reads API endpoint
export default async function handler(req, res) {
  console.log(`[USER STORY READS API] ${req.method} /api/user-story-reads`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "POST") {
      // Record that a user read a story
      const { userId, storyId } = req.body;

      console.log(
        `[USER STORY READS API] Recording read: User ${userId} read story ${storyId}`,
      );

      // In development, we'll just simulate success
      // In production with a real database, this would actually record the read

      return res.status(200).json({
        success: true,
        message: "Story read recorded successfully",
        userId: userId,
        storyId: storyId,
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "GET") {
      // Get reading history for a user
      const { userId } = req.query;

      console.log(`[USER STORY READS API] Getting reads for user ${userId}`);

      // In development, return empty array
      // In production, this would query the database

      return res.status(200).json({
        success: true,
        reads: [],
        userId: userId,
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error("[USER STORY READS API] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
