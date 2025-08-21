import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[TEST STORIES LIST] ${req.method} /api/test-stories-listing`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    await connectToDatabase();
    console.log("[TEST STORIES LIST] Connected to database");

    const stories = await Story.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("-__v");

    // Transform MongoDB documents exactly like the main API does
    const transformedStories = stories.map((story) => {
      const storyObj = story.toObject();
      return {
        id: story.storyId,
        title: story.title,
        author: story.author,
        // Use production statistics from MongoDB
        rating: story.rating || 0,
        ratingCount: story.ratingCount || 0,
        viewCount: story.viewCount || 0,
        commentCount: story.commentCount || 0,
        likeCount: story.likeCount || 0,
        // Show both raw values and Mongoose property values
        rawStats: {
          rating: storyObj.rating,
          ratingCount: storyObj.ratingCount,
          viewCount: storyObj.viewCount,
          commentCount: storyObj.commentCount,
          likeCount: storyObj.likeCount,
        },
        mongooseStats: {
          rating: story.rating,
          ratingCount: story.ratingCount,
          viewCount: story.viewCount,
          commentCount: story.commentCount,
          likeCount: story.likeCount,
        },
      };
    });

    console.log(
      `[TEST STORIES LIST] Processed ${transformedStories.length} stories`,
    );

    return res.status(200).json({
      success: true,
      count: transformedStories.length,
      stories: transformedStories,
    });
  } catch (error) {
    console.error("[TEST STORIES LIST] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get stories listing",
      error: error.message,
    });
  }
}
