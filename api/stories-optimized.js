import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[STORIES OPTIMIZED] ${req.method} /api/stories-optimized`);

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
    console.log("[STORIES OPTIMIZED] Checking existing connection...");
    
    // Use existing connection if available
    if (mongoose.connection.readyState !== 1) {
      console.log("[STORIES OPTIMIZED] Creating optimized MongoDB connection...");
      
      const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rude-gyal-confessions";
      
      await mongoose.connect(MONGODB_URI, {
        // Optimized connection settings
        maxPoolSize: 5, // Limit connection pool size
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        socketTimeoutMS: 10000, // 10 second socket timeout
        bufferCommands: false,
        bufferMaxEntries: 0,
        dbName: "rude-gyal-confessions"
      });
    }
    
    console.log("[STORIES OPTIMIZED] Using direct collection access...");
    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    
    console.log("[STORIES OPTIMIZED] Executing optimized query...");
    
    // Strategy: Query without the heavy content field first, then add minimal content
    const stories = await storiesCollection.find(
      { published: true },
      {
        // Exclude heavy fields that might cause issues
        projection: {
          content: 0 // Exclude content field to improve performance
        }
      }
    )
    .sort({ createdAt: -1 })
    .toArray();
    
    console.log(`[STORIES OPTIMIZED] Retrieved ${stories.length} stories without content`);

    if (stories && stories.length > 0) {
      console.log("[STORIES OPTIMIZED] Transforming stories for frontend...");
      
      const transformedStories = stories.map((story) => {
        return {
          id: story.storyId || story._id.toString(),
          title: story.title || "Untitled",
          // Use a placeholder for content to avoid heavy field issues
          content: "Click to read this captivating story...",
          excerpt: story.excerpt || `A ${story.category || 'captivating'} story by ${story.author}`,
          author: story.author || "Unknown Author",
          category: story.category || "Romance",
          tags: Array.isArray(story.tags) ? story.tags : [],
          accessLevel: story.accessLevel || "free",
          isPublished: story.published || false,
          publishedAt: story.publishedAt || story.createdAt,
          createdAt: story.createdAt || new Date(),
          updatedAt: story.updatedAt || new Date(),
          // Use actual MongoDB field values
          viewCount: story.views || story.viewCount || 0,
          rating: story.averageRating || story.rating || 0,
          ratingCount: story.ratingCount || 0,
          likeCount: story.likeCount || 0,
          commentCount: story.commentCount || 0,
          image: story.image || null,
          audioUrl: story.audioUrl || null,
        };
      });

      console.log(`[STORIES OPTIMIZED] Successfully returning ${transformedStories.length} MongoDB stories`);
      return res.json(transformedStories);
      
    } else {
      console.log("[STORIES OPTIMIZED] No stories found");
      return res.json([]);
    }

  } catch (error) {
    console.error("[STORIES OPTIMIZED] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch optimized stories",
      error: error.message
    });
  }
}
