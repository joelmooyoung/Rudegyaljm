import { connectToDatabase } from "../lib/mongodb.js";
import { User, Story, Comment, Like, Rating } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[MONGODB TEST] Testing MongoDB connection and data`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Test 1: Basic connection
    console.log(`[MONGODB TEST] Testing MongoDB connection...`);
    await connectToDatabase();
    console.log(`[MONGODB TEST] ✅ Connection successful`);

    // Test 2: Check if test users exist
    console.log(`[MONGODB TEST] Checking for test users...`);
    const users = await User.find({
      email: { $in: ["admin@test.com", "premium@test.com", "free@test.com"] },
    });

    console.log(`[MONGODB TEST] Found ${users.length} test users:`, users);

    // Test 3: Create test users if they don't exist
    if (users.length === 0) {
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

    // Test 4: Check/Create sample stories
    console.log(`[MONGODB TEST] Checking for sample stories...`);
    const storyCount = await Story.countDocuments();

    if (storyCount === 0) {
      console.log(`[MONGODB TEST] Creating sample stories...`);

      const sampleStories = [
        {
          storyId: "1",
          title: "Midnight Desires",
          content:
            "The city slept, but her heart was wide awake, pulsing with a rhythm she had never felt before. Under the moonlight streaming through her window, she made a decision that would change everything. The velvet darkness of midnight held secrets and desires she never knew existed...",
          author: "Seductive Sage",
          category: "Romance",
          tags: ["Passionate", "Romance", "Midnight"],
          published: true,
          featured: true,
          views: 1547,
          likeCount: 2,
          averageRating: 4.5,
          ratingCount: 2,
        },
        {
          storyId: "2",
          title: "Summer Heat",
          content:
            "The beach was empty except for the two of them. Maria could feel the sand between her toes, warm from the day's sun. The waves crashed rhythmically, creating a symphony that matched the beating of her heart. When he took her hand, time seemed to stand still...",
          author: "Ocean Writer",
          category: "Passionate",
          tags: ["Beach", "Summer", "Heat", "Desire"],
          published: true,
          featured: false,
          views: 892,
          likeCount: 1,
          averageRating: 5.0,
          ratingCount: 1,
        },
      ];

      const createdStories = await Story.insertMany(sampleStories);
      console.log(
        `[MONGODB TEST] ✅ Created ${createdStories.length} sample stories`,
      );
    }

    // Test 5: Get all counts
    const userCount = await User.countDocuments();
    const storyCountFinal = await Story.countDocuments();
    const commentCount = await Comment.countDocuments();
    const likeCount = await Like.countDocuments();
    const ratingCount = await Rating.countDocuments();

    // Test 6: Environment variables check
    const envCheck = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      NODE_ENV: process.env.NODE_ENV || "not set",
    };

    console.log(`[MONGODB TEST] Data counts:`, {
      users: userCount,
      stories: storyCountFinal,
      comments: commentCount,
      likes: likeCount,
      ratings: ratingCount,
    });

    return res.status(200).json({
      success: true,
      message: "MongoDB test completed successfully",
      results: {
        connection: "✅ Connected to MongoDB",
        dataCount: {
          users: userCount,
          stories: storyCountFinal,
          comments: commentCount,
          likes: likeCount,
          ratings: ratingCount,
        },
        testUsers: [
          { email: "admin@test.com", password: "admin123", type: "admin" },
          {
            email: "premium@test.com",
            password: "premium123",
            type: "premium",
          },
          { email: "free@test.com", password: "free123", type: "free" },
        ],
        environment: envCheck,
        recommendations: {
          ...(userCount === 0 && {
            noUsers: "Test users will be created automatically on first login",
          }),
          ...(storyCountFinal === 0 && {
            noStories: "Sample stories were just created",
          }),
          ...(!envCheck.MONGODB_URI && {
            missingEnv:
              "Set MONGODB_URI environment variable for database connection",
          }),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[MONGODB TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "MongoDB test failed",
      error: error.message,
      recommendations: {
        checkMongoDB: "Ensure MongoDB is running (locally or Atlas)",
        checkEnvironment: "Verify MONGODB_URI environment variable is set",
        localMongoDB:
          "For local: MONGODB_URI=mongodb://localhost:27017/rude-gyal-confessions",
        atlasMongoDB:
          "For Atlas: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rude-gyal-confessions",
      },
    });
  }
}
