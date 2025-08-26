// Test script to directly check the stories API response
import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[TEST STORIES API] ${req.method} /api/test-stories-api`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    // Connect to MongoDB
    const dbConnection = await connectToDatabase();

    if (!dbConnection.isConnected) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    // Test 1: Count all stories
    const totalCount = await Story.countDocuments({});
    console.log(`[TEST] Total stories in database: ${totalCount}`);

    // Test 2: Count published stories
    const publishedCount = await Story.countDocuments({ published: true });
    console.log(`[TEST] Published stories: ${publishedCount}`);

    // Test 3: Count unpublished stories
    const unpublishedCount = await Story.countDocuments({ published: false });
    console.log(`[TEST] Unpublished stories: ${unpublishedCount}`);

    // Test 4: Simulate the exact query from stories.js API with admin=true
    const adminQuery = {}; // Empty query for admin=true
    const adminStories = await Story.find(adminQuery)
      .sort({ createdAt: -1 })
      .select("-__v");
    console.log(`[TEST] Admin query returned: ${adminStories.length} stories`);

    // Test 5: Simulate the exact query from stories.js API with admin=false
    const publicQuery = { published: true }; // Published only for public
    const publicStories = await Story.find(publicQuery)
      .sort({ createdAt: -1 })
      .select("-__v");
    console.log(
      `[TEST] Public query returned: ${publicStories.length} stories`,
    );

    // Test 6: Get sample stories with titles and published status
    const sampleStories = await Story.find({})
      .select("storyId title published author createdAt")
      .sort({ createdAt: -1 })
      .limit(15);

    console.log(
      `[TEST] Sample stories:`,
      sampleStories.map((s) => ({
        id: s.storyId,
        title: s.title,
        published: s.published,
        author: s.author,
      })),
    );

    // Test 7: Check if there's any limit being applied
    const allStoriesNoLimit = await Story.find({}).sort({ createdAt: -1 });
    console.log(
      `[TEST] All stories without limit: ${allStoriesNoLimit.length}`,
    );

    return res.status(200).json({
      success: true,
      tests: {
        totalCount,
        publishedCount,
        unpublishedCount,
        adminQueryCount: adminStories.length,
        publicQueryCount: publicStories.length,
        allStoriesNoLimit: allStoriesNoLimit.length,
      },
      sampleStories: sampleStories.map((story) => ({
        id: story.storyId,
        title: story.title,
        published: story.published,
        author: story.author,
        createdAt: story.createdAt,
      })),
      analysis: {
        database_connected: dbConnection.isConnected,
        admin_query_used: "{}",
        public_query_used: "{ published: true }",
        sort_used: "{ createdAt: -1 }",
        select_used: "-__v",
      },
    });
  } catch (error) {
    console.error(`[TEST STORIES API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
