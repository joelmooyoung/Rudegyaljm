import { connectToDatabase } from "../../lib/mongodb.js";
import { Story, Like, Rating, Comment } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[UNIFIED STATS] ${req.method} /api/admin/unified-stats`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    console.log("[UNIFIED STATS] Connected to database");

    if (req.method === "GET") {
      // Return current stats from MongoDB
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
        message: "Unified stats retrieved successfully",
        storyCount: Object.keys(stats).length,
        stats: stats,
        source: "MongoDB",
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "POST") {
      const { action, storyId, testData } = req.body;

      if (action === "refresh-all") {
        // Refresh all story stats by recalculating from actual data
        console.log(
          "[UNIFIED STATS] Refreshing all story stats from actual data...",
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
                // Keep existing viewCount as it's tracked differently
                viewCount: currentViewCount,
              },
            },
          );

          refreshedCount++;
          console.log(
            `[UNIFIED STATS] Refreshed ${story.storyId}: likes=${actualLikeCount}, ratings=${actualRatingCount}, comments=${actualCommentCount}, avgRating=${actualAverageRating.toFixed(1)}`,
          );
        }

        return res.status(200).json({
          success: true,
          message: `Refreshed stats for ${refreshedCount} stories`,
          refreshedCount,
          source: "MongoDB",
          timestamp: new Date().toISOString(),
        });
      }

      if (action === "add-test-data" && testData && storyId) {
        // Add test data directly to MongoDB
        console.log(
          `[UNIFIED STATS] Adding test data for story ${storyId}:`,
          testData,
        );

        const story = await Story.findOne({ storyId });
        if (!story) {
          return res.status(404).json({
            success: false,
            message: "Story not found",
          });
        }

        // Add test likes
        if (testData.likes) {
          for (let i = 0; i < testData.likes; i++) {
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
        if (testData.ratings) {
          for (let i = 0; i < testData.ratings; i++) {
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
        if (testData.comments) {
          for (let i = 0; i < testData.comments; i++) {
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
        if (testData.views) {
          const currentStory = await Story.findOne({ storyId });
          const currentViews = currentStory.toObject().viewCount || 0;

          await Story.findOneAndUpdate(
            { storyId },
            { $set: { viewCount: currentViews + testData.views } },
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
        message: "Invalid action or missing data",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error("[UNIFIED STATS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process unified stats",
      error: error.message,
    });
  }
}
