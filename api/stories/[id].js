import { connectToDatabase } from "../../lib/mongodb.js";
import { Story } from "../../models/index.js";

export default async function handler(req, res) {
  const { id: storyId } = req.query; // Get ID from URL parameter

  console.log(`[STORY UPDATE] ${req.method} /api/stories/${storyId}`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    if (req.method === "GET") {
      // Get single story
      const story = await Story.findOne({ storyId });

      if (!story) {
        return res.status(404).json({
          success: false,
          message: "Story not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: story,
      });
    }

    if (req.method === "PUT") {
      console.log(`[STORY UPDATE] Updating story: ${storyId}`);
      console.log(`[STORY UPDATE] Request body:`, req.body);

      // Find the story by storyId (not id)
      const existingStory = await Story.findOne({ storyId });

      if (!existingStory) {
        console.log(`[STORY UPDATE] Story not found: ${storyId}`);
        return res.status(404).json({
          success: false,
          message: `Story not found: ${storyId}`,
        });
      }

      // Update fields from request body
      const updateFields = {};
      const allowedFields = [
        "title",
        "content",
        "author",
        "category",
        "tags",
        "published",
        "featured",
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      }

      console.log(`[STORY UPDATE] Updating fields:`, updateFields);

      // Update the story
      const updatedStory = await Story.findOneAndUpdate(
        { storyId },
        updateFields,
        { new: true },
      );

      console.log(`[STORY UPDATE] ✅ Updated story: ${storyId}`);

      return res.status(200).json({
        success: true,
        message: "Story updated successfully",
        data: {
          id: updatedStory.storyId,
          title: updatedStory.title,
          author: updatedStory.author,
          category: updatedStory.category,
          published: updatedStory.published,
        },
      });
    }

    if (req.method === "DELETE") {
      const deletedStory = await Story.findOneAndDelete({ storyId });

      if (!deletedStory) {
        return res.status(404).json({
          success: false,
          message: "Story not found",
        });
      }

      console.log(`[STORY UPDATE] ✅ Deleted story: ${storyId}`);

      return res.status(200).json({
        success: true,
        message: "Story deleted successfully",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error(`[STORY UPDATE] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
