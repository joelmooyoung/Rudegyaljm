// Simple database status check for Vercel MongoDB
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const mongoUri = process.env.MONGODB_URI;

  // Quick environment check
  if (!mongoUri) {
    return res.status(500).json({
      success: false,
      status: "❌ MONGODB_URI not configured",
      message: "MongoDB connection string missing in environment variables",
      environment: process.env.NODE_ENV || "unknown",
      recommendations: [
        "Add MONGODB_URI to Vercel environment variables",
        "Ensure it includes your MongoDB Atlas connection string",
      ],
    });
  }

  try {
    // Dynamic import to handle serverless environment
    const { connectToDatabase } = await import("../lib/mongodb.js");

    console.log("[DB STATUS] Testing MongoDB connection...");
    await connectToDatabase();
    console.log("[DB STATUS] ✅ Connected successfully");

    // Try to get a simple count to test actual database access
    const { User } = await import("../models/index.js");
    const userCount = await User.countDocuments();

    return res.status(200).json({
      success: true,
      status: "✅ MongoDB Connected",
      message: "Database connection successful",
      data: {
        userCount,
        connectionString: mongoUri.replace(/\/\/.*@/, "//***:***@"), // Hide credentials
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[DB STATUS] Connection failed:", error);

    return res.status(500).json({
      success: false,
      status: "❌ Connection Failed",
      message: "Could not connect to MongoDB",
      error: error.message,
      troubleshooting: {
        1: "Check MongoDB Atlas connection string",
        2: "Verify IP whitelist allows Vercel IPs (0.0.0.0/0)",
        3: "Ensure database user has proper permissions",
        4: "Check MongoDB Atlas cluster status",
      },
      environment: process.env.NODE_ENV || "development",
    });
  }
}
