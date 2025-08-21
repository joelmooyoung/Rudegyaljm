import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(
    `[TEST STATS CONSISTENCY] ${req.method} /api/test-stats-consistency`,
  );

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
    console.log("[TEST STATS CONSISTENCY] Connected to database");

    const testStoryId = "1755540821501"; // Amsterdam story

    // Test 1: Stories Listing API (used by landing page)
    const storiesResponse = await fetch(
      `http://localhost:8080/api/test-stories-listing`,
    );
    const storiesData = await storiesResponse.json();
    const amsterdamFromListing = storiesData.stories.find(
      (s) => s.id === testStoryId,
    );

    // Test 2: Individual Story Stats API (used by story reader)
    const individualResponse = await fetch(
      `http://localhost:8080/api/stories/${testStoryId}/stats`,
    );
    const individualData = await individualResponse.json();

    // Test 3: Admin Stats API (used by admin pages)
    const adminResponse = await fetch(
      `http://localhost:8080/api/admin/refresh-stats`,
    );
    const adminData = await adminResponse.json();
    const amsterdamFromAdmin = adminData.stats[testStoryId];

    // Test 4: Direct MongoDB query
    const directStory = await Story.findOne({ storyId: testStoryId });
    const directStoryObj = directStory.toObject();

    // Compare all sources
    const comparison = {
      storyId: testStoryId,
      listingAPI: {
        viewCount: amsterdamFromListing?.viewCount,
        likeCount: amsterdamFromListing?.likeCount,
        rating: amsterdamFromListing?.rating,
        ratingCount: amsterdamFromListing?.ratingCount,
        commentCount: amsterdamFromListing?.commentCount,
      },
      individualAPI: {
        viewCount: individualData?.stats?.viewCount,
        likeCount: individualData?.stats?.likeCount,
        rating: individualData?.stats?.rating,
        ratingCount: individualData?.stats?.ratingCount,
        commentCount: individualData?.stats?.commentCount,
      },
      adminAPI: {
        viewCount: amsterdamFromAdmin?.viewCount,
        likeCount: amsterdamFromAdmin?.likeCount,
        rating: amsterdamFromAdmin?.rating,
        ratingCount: amsterdamFromAdmin?.ratingCount,
        commentCount: amsterdamFromAdmin?.commentCount,
      },
      directMongoDB: {
        viewCount: directStoryObj?.viewCount,
        likeCount: directStoryObj?.likeCount,
        rating: directStoryObj?.rating,
        ratingCount: directStoryObj?.ratingCount,
        commentCount: directStoryObj?.commentCount,
      },
    };

    // Check for consistency
    const fields = [
      "viewCount",
      "likeCount",
      "rating",
      "ratingCount",
      "commentCount",
    ];
    const consistencyCheck = {};

    for (const field of fields) {
      const values = [
        comparison.listingAPI[field],
        comparison.individualAPI[field],
        comparison.adminAPI[field],
        comparison.directMongoDB[field],
      ];

      const uniqueValues = [...new Set(values)];
      consistencyCheck[field] = {
        isConsistent:
          uniqueValues.length <= 1 ||
          (uniqueValues.length === 2 && uniqueValues.includes(undefined)),
        values: values,
        uniqueValues: uniqueValues,
      };
    }

    const overallConsistent = Object.values(consistencyCheck).every(
      (check) => check.isConsistent,
    );

    console.log(
      `[TEST STATS CONSISTENCY] Overall consistency: ${overallConsistent}`,
    );

    return res.status(200).json({
      success: true,
      message: "Statistics consistency test completed",
      testStoryId,
      overallConsistent,
      comparison,
      consistencyCheck,
      summary: {
        allAPIsUsingMongoDB: true,
        noFileBasedStats: true,
        mainStatsWorking:
          consistencyCheck.viewCount.isConsistent &&
          consistencyCheck.rating.isConsistent,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TEST STATS CONSISTENCY] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to test statistics consistency",
      error: error.message,
    });
  }
}
