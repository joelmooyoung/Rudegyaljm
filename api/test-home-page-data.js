import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[TEST HOME DATA] ${req.method} /api/test-home-page-data`);

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectToDatabase();

    // Get first few stories the same way the main API does
    const stories = await Story.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("-__v");

    // Transform exactly like main stories API
    const transformedStories = stories.map((story) => {
      const storyObj = story.toObject();
      return {
        id: story.storyId,
        title: story.title,
        author: story.author,
        excerpt: story.excerpt || story.content.substring(0, 200) + "...",
        tags: story.tags,
        category: story.category,
        accessLevel: story.accessLevel || "free",
        isPublished: story.published,
        // These are the fields the Home page expects:
        rating: storyObj.rating || 0,
        ratingCount: storyObj.ratingCount || 0,
        viewCount: storyObj.viewCount || 0,
        commentCount: storyObj.commentCount || 0,
        likeCount: storyObj.likeCount || 0,
        image: story.image,
        audioUrl: story.audioUrl,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Home page data test",
      stories: transformedStories,
      // Show raw values too for debugging
      debugInfo: transformedStories.map((story) => ({
        id: story.id,
        title: story.title,
        homePageFields: {
          rating: story.rating,
          ratingCount: story.ratingCount,
          viewCount: story.viewCount,
          commentCount: story.commentCount,
        },
      })),
    });
  } catch (error) {
    console.error("[TEST HOME DATA] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to test home page data",
      error: error.message,
    });
  }
}
