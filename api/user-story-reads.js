import { connectToDatabase } from "../lib/mongodb.js";
import { UserStoryRead, Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[USER STORY READS API] ${req.method} /api/user-story-reads`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Connect to MongoDB
    const dbConnection = await connectToDatabase();

    if (!dbConnection.isConnected) {
      console.log("📊 Using fallback - no database connection");
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    switch (req.method) {
      case "POST":
        return await recordStoryRead(req, res);
      case "GET":
        return await getUserReadingStats(req, res);
      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[USER STORY READS API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function recordStoryRead(req, res) {
  const { userId, username, storyId, storyTitle } = req.body;

  if (!userId || !storyId) {
    return res.status(400).json({
      success: false,
      message: "userId and storyId are required",
    });
  }

  try {
    // Get client IP and user agent
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Verify the story exists
    const story = await Story.findOne({ storyId });
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Create a new read record (every visit is recorded)
    const readId = `${userId}-${storyId}-${Date.now()}`;
    const newRead = new UserStoryRead({
      readId,
      userId,
      username: username || "Unknown",
      storyId,
      storyTitle: storyTitle || story.title,
      ip,
      userAgent,
      timestamp: new Date(),
    });

    await newRead.save();

    console.log(
      `[USER STORY READS] ✅ Recorded read: User ${username} read story "${storyTitle}"`,
    );

    // Get total read count for this user
    const totalReads = await UserStoryRead.countDocuments({ userId });
    const uniqueStories = await UserStoryRead.distinct("storyId", {
      userId,
    }).then((arr) => arr.length);

    return res.status(201).json({
      success: true,
      message: "Story read recorded successfully",
      data: {
        readId: newRead.readId,
        userId,
        storyId,
        timestamp: newRead.timestamp,
        totalReads,
        uniqueStories,
      },
    });
  } catch (error) {
    console.error(`[USER STORY READS] Error recording read:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to record story read",
      error: error.message,
    });
  }
}

async function getUserReadingStats(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId is required",
    });
  }

  try {
    // Get total reads for user
    const totalReads = await UserStoryRead.countDocuments({ userId });

    // Get unique stories read
    const uniqueStories = await UserStoryRead.distinct("storyId", {
      userId,
    }).then((arr) => arr.length);

    // Get recent reads (last 10)
    const recentReads = await UserStoryRead.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select("storyId storyTitle timestamp");

    // Get reading streak (consecutive days with reads)
    const reads = await UserStoryRead.find({ userId })
      .sort({ timestamp: -1 })
      .select("timestamp");

    let streak = 0;
    if (reads.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const readDates = [
        ...new Set(
          reads.map((read) => {
            const date = new Date(read.timestamp);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
          }),
        ),
      ].sort((a, b) => b - a);

      for (let i = 0; i < readDates.length; i++) {
        const expectedDate = new Date(
          today.getTime() - i * 24 * 60 * 60 * 1000,
        );
        if (readDates[i] === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        userId,
        totalReads,
        uniqueStories,
        readingStreak: streak,
        recentReads,
      },
    });
  } catch (error) {
    console.error(`[USER STORY READS] Error getting stats:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to get reading statistics",
      error: error.message,
    });
  }
}
