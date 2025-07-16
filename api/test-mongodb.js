export default async function handler(req, res) {
  console.log(`[MONGODB TEST] Testing MongoDB connection`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Test environment first
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({
        success: false,
        message: "MONGODB_URI environment variable not set",
        recommendations: {
          vercel: "Add MONGODB_URI to Vercel environment variables",
          local:
            "Create .env file with MONGODB_URI=mongodb://localhost:27017/rude-gyal-confessions",
          atlas: "Use MongoDB Atlas connection string",
        },
      });
    }

    // Dynamic import to avoid module loading issues
    const { connectToDatabase } = await import("../lib/mongodb.js");
    const { User, Story } = await import("../models/index.js");

    console.log(`[MONGODB TEST] Attempting to connect to MongoDB...`);
    await connectToDatabase();
    console.log(`[MONGODB TEST] ✅ Connection successful`);

    // Test basic query
    const userCount = await User.countDocuments();
    const storyCount = await Story.countDocuments();

    console.log(
      `[MONGODB TEST] Found ${userCount} users, ${storyCount} stories`,
    );

    // Create test users if none exist
    if (userCount === 0) {
      console.log(`[MONGODB TEST] Creating test users...`);

      const testUsers = [
        {
          userId: "admin1",
          username: "admin",
          email: "admin@test.com",
          password: "admin123",
          type: "admin",
          country: "United States",
          active: true,
          loginCount: 0,
        },
        {
          userId: "premium1",
          username: "premiumuser",
          email: "premium@test.com",
          password: "premium123",
          type: "premium",
          country: "United States",
          active: true,
          loginCount: 0,
        },
        {
          userId: "free1",
          username: "freeuser",
          email: "free@test.com",
          password: "free123",
          type: "free",
          country: "United States",
          active: true,
          loginCount: 0,
        },
      ];

      const createdUsers = await User.insertMany(testUsers);
      console.log(
        `[MONGODB TEST] ✅ Created ${createdUsers.length} test users`,
      );
    }

    return res.status(200).json({
      success: true,
      message: "MongoDB connection successful",
      results: {
        connection: "✅ Connected",
        userCount,
        storyCount,
        testUsers: [
          { email: "admin@test.com", password: "admin123" },
          { email: "premium@test.com", password: "premium123" },
          { email: "free@test.com", password: "free123" },
        ],
        mongoUri: mongoUri.replace(/\/\/.*@/, "//***:***@"), // Hide credentials
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[MONGODB TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "MongoDB test failed",
      error: error.message,
      troubleshooting: {
        connectionError: "Check if MongoDB URI is correct",
        networkError: "Verify network access to MongoDB",
        authError: "Check MongoDB username/password",
        localError: "Ensure MongoDB is running locally",
      },
    });
  }
}
