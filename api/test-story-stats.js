// Test endpoint to verify story stats are being saved correctly
export default function handler(req, res) {
  console.log(`[TEST STORY STATS] ${req.method} /api/test-story-stats`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    // Return instructions for testing
    return res.status(200).json({
      success: true,
      message: "Story stats test endpoint",
      instructions: [
        "1. Create a new story with specific stats (views=100, rating=4.5, etc.)",
        "2. Check if the stats are saved correctly in the database",
        "3. Verify that editing preserves the stats",
      ],
      testData: {
        title: "Test Story Stats",
        content: "<p>This is a test story for verifying stats saving.</p>",
        author: "Test Author",
        category: "Romance",
        tags: ["test", "stats"],
        excerpt: "Testing stats saving functionality",
        accessLevel: "free",
        published: true,
        viewCount: 150,
        rating: 4.2,
        ratingCount: 25,
        commentCount: 8,
        likeCount: 42,
      },
      endpoint: "/api/stories",
      method: "POST",
    });
  }

  if (req.method === "POST") {
    // Test the actual story creation with stats
    const testStoryData = {
      title: "Test Story Stats - " + Date.now(),
      content: "<p>This is a test story for verifying stats saving.</p>",
      author: "Test Author",
      category: "Romance",
      tags: ["test", "stats"],
      excerpt: "Testing stats saving functionality",
      accessLevel: "free",
      published: true,
      viewCount: 150,
      rating: 4.2,
      ratingCount: 25,
      commentCount: 8,
      likeCount: 42,
    };

    console.log(
      "[TEST STORY STATS] Testing story creation with stats:",
      testStoryData,
    );

    return res.status(200).json({
      success: true,
      message: "Use this data to test story creation",
      testData: testStoryData,
      instructions: "Send this data to POST /api/stories to test stats saving",
      expectedBehavior:
        "Stats should be saved with the exact values provided, not reset to 0",
    });
  }

  return res.status(405).json({
    success: false,
    error: "Method not allowed",
    allowedMethods: ["GET", "POST"],
  });
}
