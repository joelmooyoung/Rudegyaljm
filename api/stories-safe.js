import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[STORIES SAFE] ${req.method} /api/stories-safe`);

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
    console.log("[STORIES SAFE] Starting safe loading with error handling...");
    
    // Use existing connection 
    if (mongoose.connection.readyState !== 1) {
      console.log("[STORIES SAFE] Database not connected");
      return res.status(500).json({
        success: false,
        message: "Database connection not available"
      });
    }
    
    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    
    console.log("[STORIES SAFE] Using safe document loading strategy...");
    
    // Strategy: Load stories one by one with individual error handling
    const successfulStories = [];
    const errors = [];
    
    // Try to get story IDs first with minimal data
    console.log("[STORIES SAFE] Getting story IDs...");
    const storyIds = await storiesCollection.find(
      { published: true },
      { projection: { _id: 1, storyId: 1, title: 1 } }
    ).toArray();
    
    console.log(`[STORIES SAFE] Found ${storyIds.length} story IDs to process`);
    
    // Process stories one by one to identify problematic ones
    for (let i = 0; i < storyIds.length; i++) { // Load all stories since safe loading works
      const storyRef = storyIds[i];

      try {
        console.log(`[STORIES SAFE] Loading story ${i + 1}/${storyIds.length}: ${storyRef.title}`);
        
        const story = await storiesCollection.findOne(
          { _id: storyRef._id },
          {
            projection: {
              // Load essential fields only, exclude content
              storyId: 1,
              title: 1,
              author: 1,
              excerpt: 1,
              category: 1,
              tags: 1,
              accessLevel: 1,
              published: 1,
              views: 1,
              viewCount: 1,
              averageRating: 1,
              rating: 1,
              ratingCount: 1,
              likeCount: 1,
              commentCount: 1,
              createdAt: 1,
              updatedAt: 1,
              image: 1,
              audioUrl: 1
            }
          }
        );
        
        if (story) {
          successfulStories.push(story);
          console.log(`[STORIES SAFE] ✅ Loaded: ${story.title} by ${story.author}`);
        }
        
      } catch (storyError) {
        console.error(`[STORIES SAFE] ❌ Failed to load story ${storyRef.title}:`, storyError.message);
        errors.push({
          storyId: storyRef.storyId,
          title: storyRef.title,
          error: storyError.message
        });
      }
    }
    
    console.log(`[STORIES SAFE] Successfully loaded ${successfulStories.length} stories, ${errors.length} errors`);
    
    if (successfulStories.length > 0) {
      const transformedStories = successfulStories.map((story) => ({
        id: story.storyId || story._id.toString(),
        title: story.title || "Untitled",
        content: "Full story content available - click to read",
        excerpt: story.excerpt || `A ${story.category || 'captivating'} story by ${story.author}`,
        author: story.author || "Unknown Author",
        category: story.category || "Romance", 
        tags: Array.isArray(story.tags) ? story.tags : [],
        accessLevel: story.accessLevel || "free",
        isPublished: story.published || false,
        publishedAt: story.publishedAt || story.createdAt,
        createdAt: story.createdAt || new Date(),
        updatedAt: story.updatedAt || new Date(),
        viewCount: story.views || story.viewCount || 0,
        rating: story.averageRating || story.rating || 0,
        ratingCount: story.ratingCount || 0,
        likeCount: story.likeCount || 0,
        commentCount: story.commentCount || 0,
        image: story.image || null,
        audioUrl: story.audioUrl || null,
      }));

      console.log(`[STORIES SAFE] Returning ${transformedStories.length} safe MongoDB stories`);
      return res.json(transformedStories);
    } else {
      console.log("[STORIES SAFE] No stories could be loaded safely");
      return res.json([]);
    }

  } catch (error) {
    console.error("[STORIES SAFE] Critical error:", error);
    return res.status(500).json({
      success: false,
      message: "Safe story loading failed",
      error: error.message
    });
  }
}
