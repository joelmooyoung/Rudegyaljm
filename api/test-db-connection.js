import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[DB TEST] ${req.method} /api/test-db-connection`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    console.log("[DB TEST] Testing MongoDB connection...");
    
    await connectToDatabase();
    console.log("[DB TEST] ✅ Database connected successfully");

    // Get user count
    const userCount = await User.countDocuments();
    console.log(`[DB TEST] Found ${userCount} users in database`);

    // Get sample users (without passwords)
    const sampleUsers = await User.find({}, {
      email: 1,
      username: 1,
      type: 1,
      active: 1,
      createdAt: 1,
      lastLogin: 1,
      _id: 0
    }).limit(5);

    console.log("[DB TEST] Sample users retrieved:", sampleUsers.length);

    return res.status(200).json({
      success: true,
      message: "Database connection successful",
      userCount: userCount,
      sampleUsers: sampleUsers,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[DB TEST] ❌ Database connection failed:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
