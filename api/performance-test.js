import { connectToDatabase } from "../lib/mongodb.js";
import { Story, Comment } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[PERFORMANCE TEST] ${req.method} /api/performance-test`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    const testResults = {};
    const startTime = Date.now();

    // Test 1: Count total stories
    const storiesStart = Date.now();
    const totalStories = await Story.countDocuments({ published: true });
    const storiesTime = Date.now() - storiesStart;
    testResults.countStories = { time: storiesTime, count: totalStories };

    // Test 2: Get first 8 stories (like home page)
    const storiesListStart = Date.now();
    const stories = await Story.find({ published: true })
      .select("storyId title author category viewCount likeCount commentCount")
      .sort({ createdAt: -1 })
      .limit(8);
    const storiesListTime = Date.now() - storiesListStart;
    testResults.getStories = { time: storiesListTime, count: stories.length };

    // Test 3: Count comments for these stories (bulk)
    const commentsStart = Date.now();
    const storyIds = stories.map((s) => s.storyId);
    const commentCounts = await Comment.aggregate([
      { $match: { storyId: { $in: storyIds } } },
      { $group: { _id: "$storyId", count: { $sum: 1 } } },
    ]);
    const commentsTime = Date.now() - commentsStart;
    testResults.bulkCommentCounts = {
      time: commentsTime,
      stories: storyIds.length,
      comments: commentCounts.length,
    };

    // Test 4: Simulate old approach - individual stats calls (don't actually do 8 calls, just simulate timing)
    const individualStart = Date.now();
    // Just do one call to estimate timing
    const sampleStory = stories[0];
    if (sampleStory) {
      const sampleCommentCount = await Comment.countDocuments({
        storyId: sampleStory.storyId,
      });
    }
    const individualTime = Date.now() - individualStart;
    const estimatedOldTime = individualTime * stories.length; // Estimate total time for all stories
    testResults.individualStatsEstimate = {
      singleTime: individualTime,
      estimatedTotalTime: estimatedOldTime,
      wouldBeSlowerBy:
        Math.round((estimatedOldTime / commentsTime) * 100) / 100,
    };

    const totalTime = Date.now() - startTime;

    return res.json({
      success: true,
      totalTestTime: totalTime,
      timestamp: new Date().toISOString(),
      tests: testResults,
      summary: {
        bulkVsIndividual: `Bulk operations are ~${testResults.individualStatsEstimate.wouldBeSlowerBy}x faster than individual calls`,
        recommendation:
          totalTime < 500
            ? "✅ Performance is good"
            : "⚠️ Performance may need optimization",
      },
    });
  } catch (error) {
    console.error("[PERFORMANCE TEST] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Performance test failed",
      error: error.message,
    });
  }
}
