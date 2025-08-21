import { connectToDatabase } from "../lib/mongodb.js";
import { Story, Comment } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    
    // Get first few stories for comparison
    const stories = await Story.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(3);

    const comparisons = [];
    
    for (const story of stories) {
      const storyObj = story.toObject();
      
      // Get real comment count
      const realCommentCount = await Comment.countDocuments({ storyId: story.storyId });
      
      // Home page data (what /api/stories returns)
      const homePageData = {
        id: story.storyId,
        title: story.title,
        rating: storyObj.rating || 0,
        ratingCount: storyObj.ratingCount || 0,
        viewCount: storyObj.viewCount || 0,
        commentCount: realCommentCount,
        likeCount: storyObj.likeCount || 0,
      };
      
      // Raw MongoDB fields for debugging
      const mongodbFields = {
        storyId: story.storyId,
        rating: storyObj.rating,
        averageRating: storyObj.averageRating,
        ratingCount: storyObj.ratingCount,
        viewCount: storyObj.viewCount,
        views: storyObj.views,
        commentCount: storyObj.commentCount,
        realCommentCount: realCommentCount,
        likeCount: storyObj.likeCount,
        allFields: Object.keys(storyObj).filter(key => key.includes('rating') || key.includes('view') || key.includes('comment') || key.includes('like'))
      };
      
      comparisons.push({
        title: story.title,
        storyId: story.storyId,
        homePageData,
        mongodbFields
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stats comparison data",
      comparisons
    });

  } catch (error) {
    console.error("[STATS COMPARISON] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
