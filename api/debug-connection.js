export default async function handler(req, res) {
  console.log("API endpoint hit:", req.url);

  try {
    // Check environment variables
    const mongoUri = process.env.MONGODB_URI;
    console.log("MONGODB_URI exists:", !!mongoUri);
    console.log("NODE_ENV:", process.env.NODE_ENV);

    if (!mongoUri) {
      return res.status(500).json({
        error: "MONGODB_URI not found",
        env: process.env.NODE_ENV,
        available: Object.keys(process.env).filter((k) => k.includes("MONGO")),
      });
    }

    // Try to import and connect
    const { connectToDatabase } = await import("../lib/mongodb.js");
    await connectToDatabase();

    console.log("MongoDB connection successful");

    // Try to import models and count
    const { Story } = await import("../models/index.js");
    const storyCount = await Story.countDocuments();

    console.log("Story count:", storyCount);

    res.status(200).json({
      success: true,
      storyCount,
      mongoUri: mongoUri.substring(0, 20) + "...",
      message: "Database connection working!",
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
