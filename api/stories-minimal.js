import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[STORIES MINIMAL] ${req.method} /api/stories-minimal`);

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
    console.log("[STORIES MINIMAL] Loading minimal story metadata...");
    
    // Use existing connection
    if (mongoose.connection.readyState !== 1) {
      console.log("[STORIES MINIMAL] Database not connected");
      return res.status(500).json({
        success: false,
        message: "Database connection not available"
      });
    }
    
    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    
    console.log("[STORIES MINIMAL] Getting story titles and basic info only...");
    
    // Load only the absolute minimum fields to avoid hanging
    const stories = await storiesCollection.find(
      { published: true },
      {
        projection: {
          storyId: 1,
          title: 1,
          author: 1,
          category: 1,
          accessLevel: 1,
          views: 1,
          viewCount: 1,
          averageRating: 1,
          rating: 1,
          createdAt: 1,
          // Exclude everything else including content, excerpt, tags, etc.
        }
      }
    )
    .sort({ createdAt: -1 })
    .limit(30) // Increase to 30 stories since minimal API works well
    .toArray();
    
    console.log(`[STORIES MINIMAL] Retrieved ${stories.length} minimal story records`);

    if (stories && stories.length > 0) {
      const transformedStories = stories.map((story) => ({
        id: story.storyId || story._id.toString(),
        title: story.title || "Untitled",
        content: "Click to read this captivating story...", // Simple placeholder
        excerpt: `A ${story.category || 'passionate'} story by ${story.author}`, // Generated excerpt
        author: story.author || "Unknown Author",
        category: story.category || "Romance",
        tags: ["passion", "romance"], // Simple default tags
        accessLevel: story.accessLevel || "free",
        isPublished: true,
        publishedAt: story.createdAt || new Date(),
        createdAt: story.createdAt || new Date(),
        updatedAt: story.createdAt || new Date(),
        viewCount: story.views || story.viewCount || 0,
        rating: story.averageRating || story.rating || 0,
        ratingCount: 50, // Default value
        likeCount: 0, // Default value
        commentCount: 0, // Default value
        image: null,
        audioUrl: null,
      }));

      console.log(`[STORIES MINIMAL] Returning ${transformedStories.length} minimal MongoDB stories`);
      return res.json(transformedStories);
    } else {
      console.log("[STORIES MINIMAL] No stories found");
      return res.json([]);
    }

  } catch (error) {
    console.error("[STORIES MINIMAL] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load minimal stories",
      error: error.message
    });
  }
}
