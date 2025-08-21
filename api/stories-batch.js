import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[STORIES BATCH] ${req.method} /api/stories-batch`);

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
    console.log("[STORIES BATCH] Starting batch loading approach...");
    
    // Use existing connection
    if (mongoose.connection.readyState !== 1) {
      console.log("[STORIES BATCH] Connection not ready, using fallback");
      return res.status(500).json({
        success: false,
        message: "Database connection not available"
      });
    }
    
    const db = mongoose.connection.db;
    const storiesCollection = db.collection('stories');
    
    console.log("[STORIES BATCH] Getting total count...");
    const totalCount = await storiesCollection.countDocuments({ published: true });
    console.log(`[STORIES BATCH] Total stories: ${totalCount}`);
    
    // Strategy: Load stories in multiple small batches to avoid timeouts
    const batchSize = 5;
    const maxBatches = Math.ceil(Math.min(totalCount, 43) / batchSize); // Load up to 43 stories
    const allStories = [];
    
    console.log(`[STORIES BATCH] Loading ${maxBatches} batches of ${batchSize} stories each...`);
    
    for (let batch = 0; batch < maxBatches; batch++) {
      const skip = batch * batchSize;
      console.log(`[STORIES BATCH] Loading batch ${batch + 1}/${maxBatches} (skip: ${skip})...`);
      
      try {
        const batchStories = await storiesCollection.find(
          { published: true },
          {
            projection: {
              // Include only essential fields for performance
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
              // Exclude content field completely
            }
          }
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(batchSize)
        .toArray();
        
        console.log(`[STORIES BATCH] Batch ${batch + 1} loaded: ${batchStories.length} stories`);
        allStories.push(...batchStories);
        
        // Small delay to prevent overwhelming the database
        if (batch < maxBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } catch (batchError) {
        console.error(`[STORIES BATCH] Error in batch ${batch + 1}:`, batchError.message);
        break; // Stop loading if a batch fails
      }
    }
    
    console.log(`[STORIES BATCH] Successfully loaded ${allStories.length} stories total`);
    
    if (allStories.length > 0) {
      const transformedStories = allStories.map((story) => ({
        id: story.storyId || story._id.toString(),
        title: story.title || "Untitled",
        content: "Full story available - click to read",
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

      console.log(`[STORIES BATCH] Returning ${transformedStories.length} MongoDB stories`);
      return res.json(transformedStories);
    } else {
      console.log("[STORIES BATCH] No stories loaded");
      return res.json([]);
    }

  } catch (error) {
    console.error("[STORIES BATCH] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load stories in batches",
      error: error.message
    });
  }
}
