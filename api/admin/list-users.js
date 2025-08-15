// Admin endpoint to list all database users with their access levels
import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[LIST USERS API] ${req.method} /api/admin/list-users`);

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
    console.log("[LIST USERS API] Connecting to database...");
    await connectToDatabase();
    console.log("[LIST USERS API] Database connected successfully");

    // Get all users from database
    const users = await User.find({})
      .select("userId username email type active createdAt lastLogin loginCount")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[LIST USERS API] Found ${users.length} users in database`);

    // Transform and format user data (excluding passwords for security)
    const userList = users.map((user) => ({
      id: user.userId || user._id.toString(),
      email: user.email,
      username: user.username,
      accessLevel: user.type || "free", // admin, premium, free
      isActive: user.active !== false,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount || 0,
    }));

    console.log("[LIST USERS API] ✅ User list retrieved successfully");

    return res.status(200).json({
      success: true,
      message: `Found ${userList.length} users`,
      users: userList,
      hardcodedAccounts: [
        {
          email: "admin@rudegyalconfessions.com",
          accessLevel: "admin",
          source: "hardcoded",
          password: "admin123"
        },
        {
          email: "joelmooyoung@me.com", 
          accessLevel: "admin",
          source: "hardcoded",
          password: "password123"
        }
      ]
    });
  } catch (error) {
    console.error("[LIST USERS API] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error.message,
    });
  }
}
