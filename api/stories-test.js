export default async function handler(req, res) {
  console.log(`[STORIES TEST] ${req.method} /api/stories-test`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods", 
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    console.log("[STORIES TEST] Returning test stories response...");
    
    // Return a simple array of 5 test stories to verify response works
    const testStories = [
      {
        id: "story1",
        title: "Midnight Desires",
        content: "Test story content",
        excerpt: "A test story from your MongoDB",
        author: "Luna Starweaver",
        category: "Romance",
        tags: ["romance", "passion"],
        accessLevel: "free",
        isPublished: true,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 2343,
        rating: 4.8,
        ratingCount: 189,
        likeCount: 45,
        commentCount: 23,
        image: null,
        audioUrl: null,
      },
      {
        id: "story2",
        title: "The Executive's Secret",
        content: "Test story content",
        excerpt: "Another test story from your MongoDB",
        author: "Scarlett Blackthorne",
        category: "Forbidden",
        tags: ["forbidden", "office"],
        accessLevel: "premium",
        isPublished: true,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 1586,
        rating: 4.9,
        ratingCount: 134,
        likeCount: 78,
        commentCount: 45,
        image: null,
        audioUrl: null,
      },
      {
        id: "story3",
        title: "Summer Heat",
        content: "Test story content",
        excerpt: "A third test story from your MongoDB",
        author: "Marina Solace",
        category: "Seductive",
        tags: ["dance", "transformation"],
        accessLevel: "free",
        isPublished: true,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 2894,
        rating: 4.6,
        ratingCount: 167,
        likeCount: 89,
        commentCount: 34,
        image: null,
        audioUrl: null,
      }
    ];
    
    console.log(`[STORIES TEST] Returning ${testStories.length} test stories`);
    return res.json(testStories);

  } catch (error) {
    console.error("[STORIES TEST] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Test stories failed",
      error: error.message
    });
  }
}
