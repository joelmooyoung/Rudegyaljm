import { connectToDatabase } from "../lib/mongodb.js";
import { User, Story, LoginLog, Comment } from "../models/index.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    console.log("🔍 Verifying database contents...");

    // Connect to MongoDB
    await connectToDatabase();

    // Count documents in each collection
    const userCount = await User.countDocuments();
    const storyCount = await Story.countDocuments();
    const commentCount = await Comment.countDocuments();
    const loginLogCount = await LoginLog.countDocuments();

    // Get user details
    const users = await User.find({}, "username email type active").sort({
      type: 1,
    });

    // Get story details
    const stories = await Story.find(
      {},
      "title author published featured views",
    ).sort({ views: -1 });

    // Get recent login logs
    const recentLogs = await LoginLog.find({}, "username country success")
      .sort({ createdAt: -1 })
      .limit(5);

    const verification = {
      success: true,
      message: "Database verification complete",
      counts: {
        users: userCount,
        stories: storyCount,
        comments: commentCount,
        loginLogs: loginLogCount,
      },
      users: users.map((user) => ({
        username: user.username,
        email: user.email,
        type: user.type,
        active: user.active,
      })),
      stories: stories.map((story) => ({
        title: story.title,
        author: story.author,
        published: story.published,
        featured: story.featured,
        views: story.views,
      })),
      recentLogs: recentLogs.map((log) => ({
        username: log.username,
        country: log.country,
        success: log.success,
      })),
    };

    console.log("✅ Verification complete:", verification.counts);

    res.status(200).json(verification);
  } catch (error) {
    console.error("❌ Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Database verification failed",
      error: error.message,
    });
  }
}
