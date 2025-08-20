import { connectToDatabase } from "../lib/mongodb.js";
import { Story, Like, Rating, Comment } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[DEBUG STATS] Checking production statistics`);

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
    console.log("[DEBUG STATS] Connected to production database");

    // Get first 5 stories with their actual stats
    const stories = await Story.find({ published: true })
      .limit(5)
      .select("storyId title views likeCount commentCount averageRating ratingCount");

    console.log("[DEBUG STATS] Found stories:", stories.length);

    // Get actual counts from related collections
    const totalLikes = await Like.countDocuments();
    const totalRatings = await Rating.countDocuments();
    const totalComments = await Comment.countDocuments();

    // Sample a few stories to see their actual data
    const storyStats = [];
    for (const story of stories) {
      const likesForStory = await Like.countDocuments({ storyId: story.storyId });
      const ratingsForStory = await Rating.countDocuments({ storyId: story.storyId });
      const commentsForStory = await Comment.countDocuments({ storyId: story.storyId });
      const avgRating = await Rating.aggregate([
        { $match: { storyId: story.storyId } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } }
      ]);

      storyStats.push({
        storyId: story.storyId,
        title: story.title,
        mongoStats: {
          views: story.views,
          likeCount: story.likeCount,
          commentCount: story.commentCount,
          averageRating: story.averageRating,
          ratingCount: story.ratingCount,
        },
        actualCounts: {
          likes: likesForStory,
          ratings: ratingsForStory,
          comments: commentsForStory,
          avgRating: avgRating[0]?.avgRating || 0,
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Production database statistics debug",
      data: {
        totalStories: await Story.countDocuments({ published: true }),
        totalLikesInDb: totalLikes,
        totalRatingsInDb: totalRatings,
        totalCommentsInDb: totalComments,
        sampleStories: storyStats,
        connectionString: process.env.MONGODB_URI?.replace(/\/\/.*@/, "//***:***@"),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[DEBUG STATS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check production stats",
      error: error.message,
    });
  }
}
