import { connectToDatabase } from "../lib/mongodb.js";
import {
  User,
  Story,
  LoginLog,
  Comment,
  Like,
  Rating,
} from "../models/index.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    console.log("🗑️ Clearing database...");

    // Connect to MongoDB
    await connectToDatabase();

    // Clear all collections
    const results = await Promise.allSettled([
      User.deleteMany({}),
      Story.deleteMany({}),
      LoginLog.deleteMany({}),
      Comment.deleteMany({}),
      Like.deleteMany({}),
      Rating.deleteMany({}),
    ]);

    // Count successful deletions
    let deletedCollections = 0;
    const deletionResults = {};

    results.forEach((result, index) => {
      const collections = [
        "users",
        "stories",
        "loginLogs",
        "comments",
        "likes",
        "ratings",
      ];
      const collectionName = collections[index];

      if (result.status === "fulfilled") {
        deletedCollections++;
        deletionResults[collectionName] = result.value.deletedCount || 0;
      } else {
        deletionResults[collectionName] = `Error: ${result.reason.message}`;
      }
    });

    console.log("✅ Database cleared:", deletionResults);

    res.status(200).json({
      success: true,
      message: "Database cleared successfully",
      collectionsCleared: deletedCollections,
      details: deletionResults,
    });
  } catch (error) {
    console.error("❌ Clear database error:", error);
    res.status(500).json({
      success: false,
      message: "Database clearing failed",
      error: error.message,
    });
  }
}
