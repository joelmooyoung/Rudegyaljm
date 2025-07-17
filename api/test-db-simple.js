import { connectToDatabase } from "../lib/mongodb.js";

export default async function handler(req, res) {
  try {
    console.log("🧪 Testing MongoDB connection...");
    console.log("Environment check:", {
      hasMongoUri: !!process.env.MONGODB_URI,
      nodeEnv: process.env.NODE_ENV,
    });

    // Test connection only
    await connectToDatabase();

    console.log("✅ MongoDB connection successful");

    res.status(200).json({
      success: true,
      message: "MongoDB connection test successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    res.status(500).json({
      success: false,
      message: "MongoDB connection failed",
      error: error.message,
      stack: error.stack,
    });
  }
}
