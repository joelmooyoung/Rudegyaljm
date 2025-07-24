import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[DEBUG USERS API] ${req.method} /api/debug-users`);

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
    await connectToDatabase();

    // Get all users (limit to 10 for safety)
    const users = await User.find({})
      .select("userId username email type active createdAt")
      .limit(10)
      .sort({ createdAt: -1 });

    const userCount = await User.countDocuments();

    return res.status(200).json({
      success: true,
      userCount,
      users: users.map((user) => ({
        userId: user.userId,
        username: user.username,
        email: user.email,
        type: user.type,
        active: user.active,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("[DEBUG USERS API] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
}
