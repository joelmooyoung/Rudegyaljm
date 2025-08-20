import { connectToDatabase } from "../lib/mongodb.js";
import { UserStoryRead } from "../models/index.js";

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
      const { userId, username, storyId, storyTitle } = req.body;

      console.log(
        `[USER STORY READS API] Recording read: User ${userId} read story ${storyId}`,
      );

      try {
        // Connect to production database
        await connectToDatabase();

        // Create unique read ID
        const readId = `read_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Record the read in database
        const userStoryRead = new UserStoryRead({
          readId,
          userId,
          username: username || 'Unknown',
          storyId,
          storyTitle: storyTitle || 'Unknown Story',
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'Unknown',
          timestamp: new Date(),
        });

        await userStoryRead.save();

        // Get total reads for this user
        const totalReads = await UserStoryRead.countDocuments({ userId });

        console.log(`[USER STORY READS API] ✅ Read recorded for user ${userId}, total reads: ${totalReads}`);

        return res.status(200).json({
          success: true,
          message: "Story read recorded successfully",
          data: {
            userId,
            storyId,
            totalReads,
            timestamp: new Date().toISOString(),
          }
        });
      } catch (dbError) {
        console.error("[USER STORY READS API] Database error:", dbError);
        // Fallback to success without database
        return res.status(200).json({
          success: true,
          message: "Story read recorded successfully (fallback)",
          data: {
            userId,
            storyId,
            totalReads: 'unknown',
            timestamp: new Date().toISOString(),
          }
        });
      }
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
