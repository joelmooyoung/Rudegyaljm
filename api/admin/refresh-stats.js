import { connectToDatabase } from "../../lib/mongodb.js";
import { Story, Like, Rating, Comment } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(
    `[REFRESH STATS] ${req.method} /api/admin/refresh-stats - REDIRECTING TO UNIFIED STATS`,
  );

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    console.log("[REFRESH STATS] Connected to database");

    if (req.method === "GET") {
      // Return current stats from MongoDB (same as unified-stats)
      const stories = await Story.find({}).select(
        "storyId title viewCount likeCount rating ratingCount commentCount",
      );

      const stats = {};
      for (const story of stories) {
        const storyObj = story.toObject();
        stats[story.storyId] = {
          title: story.title,
          viewCount: storyObj.viewCount || 0,
          likeCount: storyObj.likeCount || 0,
          rating: storyObj.rating || 0,
          ratingCount: storyObj.ratingCount || 0,
          commentCount: storyObj.commentCount || 0,
        };
      }

      return res.status(200).json({
        success: true,
        message: "Stats retrieved successfully (from MongoDB)",
        storyCount: Object.keys(stats).length,
        stats: stats,
        source: "MongoDB",
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "POST") {
      const { action, storyId, testData } = req.body;

      if (action === "refresh-all") {
        // Refresh all story stats from actual MongoDB data
        console.log(
          "[REFRESH STATS] Refreshing all story stats from MongoDB...",
        );

        const stories = await Story.find({});
        let refreshedCount = 0;

        for (const story of stories) {
          // Get actual counts from related collections
          const [actualLikes, actualRatings, actualComments] =
            await Promise.all([
              Like.find({ storyId: story.storyId }),
              Rating.find({ storyId: story.storyId }),
              Comment.find({ storyId: story.storyId }),
            ]);

          // Calculate actual statistics
          const actualLikeCount = actualLikes.length;
          const actualRatingCount = actualRatings.length;
          const actualCommentCount = actualComments.length;
          const actualAverageRating =
            actualRatings.length > 0
              ? actualRatings.reduce((sum, r) => sum + r.rating, 0) /
                actualRatings.length
              : 0;

          // Get current story stats
          const storyObj = story.toObject();
          const currentViewCount = storyObj.viewCount || 0;

          // Update story with corrected stats
          await Story.findOneAndUpdate(
            { storyId: story.storyId },
            {
              $set: {
                likeCount: actualLikeCount,
                rating: Math.round(actualAverageRating * 10) / 10,
                ratingCount: actualRatingCount,
                commentCount: actualCommentCount,
                viewCount: currentViewCount,
              },
            },
          );

          refreshedCount++;
        }

        return res.status(200).json({
          success: true,
          message: `All stats refreshed successfully from MongoDB (${refreshedCount} stories)`,
          refreshedCount,
          source: "MongoDB",
          timestamp: new Date().toISOString(),
        });
      }

      if (action === "add-test-data" && storyId && testData) {
        // Add test data directly to MongoDB
        console.log(
          `[REFRESH STATS] Adding test data for story ${storyId}:`,
          testData,
        );

        const story = await Story.findOne({ storyId });
        if (!story) {
          return res.status(404).json({
            success: false,
            message: "Story not found",
          });
        }

        const { views, likes, ratings, comments } = testData;

        // Add test likes
        if (likes) {
          for (let i = 0; i < likes; i++) {
            const testUserId = `test-user-${Date.now()}-${i}`;
            await Like.findOneAndUpdate(
              { storyId, userId: testUserId },
              {
                likeId: `like_${Date.now()}_${i}`,
                storyId,
                userId: testUserId,
              },
              { upsert: true },
            );
          }
        }

        // Add test ratings
        if (ratings) {
          for (let i = 0; i < ratings; i++) {
            const testUserId = `test-rater-${Date.now()}-${i}`;
            const testRating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
            await Rating.findOneAndUpdate(
              { storyId, userId: testUserId },
              {
                ratingId: `rating_${Date.now()}_${i}`,
                storyId,
                userId: testUserId,
                rating: testRating,
              },
              { upsert: true },
            );
          }
        }

        // Add test comments
        if (comments) {
          for (let i = 0; i < comments; i++) {
            const testUserId = `test-commenter-${Date.now()}-${i}`;
            await Comment.findOneAndUpdate(
              { commentId: `comment_${Date.now()}_${i}` },
              {
                commentId: `comment_${Date.now()}_${i}`,
                storyId,
                userId: testUserId,
                username: `TestUser${i}`,
                comment: `Test comment ${i} for story ${storyId}`,
              },
              { upsert: true },
            );
          }
        }

        // Add test views
        if (views) {
          const currentStory = await Story.findOne({ storyId });
          const currentViews = currentStory.toObject().viewCount || 0;

          await Story.findOneAndUpdate(
            { storyId },
            { $set: { viewCount: currentViews + views } },
          );
        }

        // Refresh the story's stats after adding test data
        const [actualLikes, actualRatings, actualComments] = await Promise.all([
          Like.find({ storyId }),
          Rating.find({ storyId }),
          Comment.find({ storyId }),
        ]);

        const actualLikeCount = actualLikes.length;
        const actualRatingCount = actualRatings.length;
        const actualCommentCount = actualComments.length;
        const actualAverageRating =
          actualRatings.length > 0
            ? actualRatings.reduce((sum, r) => sum + r.rating, 0) /
              actualRatings.length
            : 0;

        await Story.findOneAndUpdate(
          { storyId },
          {
            $set: {
              likeCount: actualLikeCount,
              rating: Math.round(actualAverageRating * 10) / 10,
              ratingCount: actualRatingCount,
              commentCount: actualCommentCount,
            },
          },
        );

        return res.status(200).json({
          success: true,
          message: `Test data added for story ${storyId}`,
          storyId: storyId,
          testData,
          updatedStats: {
            likeCount: actualLikeCount,
            rating: Math.round(actualAverageRating * 10) / 10,
            ratingCount: actualRatingCount,
            commentCount: actualCommentCount,
          },
          source: "MongoDB",
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid action or missing parameters",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error("[REFRESH STATS] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh stats",
      error: error.message,
    });
  }
}
