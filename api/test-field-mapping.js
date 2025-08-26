import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[FIELD MAPPING TEST] ${req.method} /api/test-field-mapping`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    if (req.method === "GET") {
      // Get a sample story to test field mapping
      const stories = await Story.find({}).limit(3).select("storyId title views averageRating ratingCount likeCount commentCount");
      
      const testResults = stories.map(story => {
        const storyObj = story.toObject();
        return {
          storyId: story.storyId,
          title: story.title,
          rawFields: {
            views: storyObj.views,
            averageRating: storyObj.averageRating,
            ratingCount: storyObj.ratingCount,
            likeCount: storyObj.likeCount,
            commentCount: storyObj.commentCount
          },
          mappedFields: {
            viewCount: storyObj.views || 0,
            rating: storyObj.averageRating || 0,
            ratingCount: storyObj.ratingCount || 0,
            likeCount: storyObj.likeCount || 0,
            commentCount: storyObj.commentCount || 0
          }
        };
      });

      return res.status(200).json({
        success: true,
        message: "Field mapping test completed",
        testResults: testResults,
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === "POST") {
      // Test updating a story's stats
      const { storyId, viewCount, rating } = req.body;
      
      if (!storyId) {
        return res.status(400).json({
          success: false,
          message: "storyId is required"
        });
      }

      const story = await Story.findOne({ storyId });
      if (!story) {
        return res.status(404).json({
          success: false,
          message: "Story not found"
        });
      }

      // Test the field mapping fix
      const updateFields = {};
      if (viewCount !== undefined) {
        updateFields.views = viewCount; // Map viewCount to views
      }
      if (rating !== undefined) {
        updateFields.averageRating = rating; // Map rating to averageRating
      }

      console.log(`[FIELD MAPPING TEST] Updating story ${storyId}:`, {
        received: { viewCount, rating },
        mapped: updateFields
      });

      const updatedStory = await Story.findOneAndUpdate(
        { storyId },
        updateFields,
        { new: true }
      );

      const storyObj = updatedStory.toObject();

      return res.status(200).json({
        success: true,
        message: "Story updated successfully",
        storyId: storyId,
        updateFields: updateFields,
        result: {
          schemaFields: {
            views: storyObj.views,
            averageRating: storyObj.averageRating
          },
          responseFields: {
            viewCount: storyObj.views || 0,
            rating: storyObj.averageRating || 0
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });

  } catch (error) {
    console.error(`[FIELD MAPPING TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
    });
  }
}
