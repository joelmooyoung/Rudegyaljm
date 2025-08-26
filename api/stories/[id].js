// Individual story API endpoint - returns complete story details
import { connectToDatabase } from "../../lib/mongodb.js";
import { Story, Comment } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[STORY API] ${req.method} /api/stories/${req.query.id}`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Story ID is required",
      });
    }

    await connectToDatabase();

    switch (req.method) {
      case "GET":
        console.log(`[STORY API] Fetching story ${id}`);

        const story = await Story.findOne({ storyId: id });

        if (!story) {
          return res.status(404).json({
            success: false,
            message: "Story not found",
          });
        }

        // Get real comment count
        let commentCount = 0;
        try {
          commentCount = await Comment.countDocuments({
            storyId: story.storyId,
          });
        } catch (commentError) {
          console.warn(
            `[STORY API] Failed to get comment count:`,
            commentError,
          );
          commentCount = story.commentCount || 0;
        }

        // Transform story data with complete details
        const storyObj = story.toObject();
        const completeStory = {
          id: story.storyId,
          title: story.title || "Untitled",
          author: story.author || "Unknown Author",
          excerpt: story.excerpt || "",
          content: story.content || "",
          tags: Array.isArray(story.tags) ? story.tags : [],
          category: story.category || "Unknown",
          accessLevel: story.accessLevel || "free",
          isPublished: Boolean(story.published),
          rating: Number(storyObj.rating || 0),
          ratingCount: Number(storyObj.ratingCount || 0),
          viewCount: Number(storyObj.viewCount || 0),
          commentCount: Number(commentCount || 0),
          likeCount: Number(storyObj.likeCount || 0),
          image: story.image || null,
          audioUrl: story.audioUrl || null,
          createdAt: story.createdAt
            ? story.createdAt.toISOString()
            : new Date().toISOString(),
          updatedAt: story.updatedAt
            ? story.updatedAt.toISOString()
            : new Date().toISOString(),
        };

        console.log(
          `[STORY API] ✅ Returning complete story details for ${id}`,
        );
        return res.status(200).json({
          success: true,
          story: completeStory,
        });

      case "PUT":
        console.log(`[STORY API] Updating story ${id}`);

        const existingStory = await Story.findOne({ storyId: id });
        if (!existingStory) {
          return res.status(404).json({
            success: false,
            message: "Story not found",
          });
        }

        // Update fields
        const updateFields = {};
        if (req.body.title !== undefined) updateFields.title = req.body.title;
        if (req.body.content !== undefined)
          updateFields.content = req.body.content;
        if (req.body.author !== undefined)
          updateFields.author = req.body.author;
        if (req.body.category !== undefined)
          updateFields.category = req.body.category;
        if (req.body.tags !== undefined)
          updateFields.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
        if (req.body.image !== undefined) updateFields.image = req.body.image;
        if (req.body.excerpt !== undefined)
          updateFields.excerpt = req.body.excerpt;
        if (req.body.accessLevel !== undefined)
          updateFields.accessLevel = req.body.accessLevel;
        if (req.body.hasOwnProperty("isPublished"))
          updateFields.published = req.body.isPublished;
        if (req.body.hasOwnProperty("viewCount"))
          updateFields.viewCount = req.body.viewCount;
        if (req.body.hasOwnProperty("rating"))
          updateFields.rating = req.body.rating;
        if (req.body.hasOwnProperty("ratingCount"))
          updateFields.ratingCount = req.body.ratingCount;
        if (req.body.hasOwnProperty("commentCount"))
          updateFields.commentCount = req.body.commentCount;
        if (req.body.hasOwnProperty("likeCount"))
          updateFields.likeCount = req.body.likeCount;
        if (req.body.audioUrl !== undefined)
          updateFields.audioUrl = req.body.audioUrl;

        updateFields.updatedAt = new Date();

        const updatedStory = await Story.findOneAndUpdate(
          { storyId: id },
          updateFields,
          { new: true },
        );

        console.log(`[STORY API] ✅ Updated story ${id}`);

        // Add cache invalidation headers to signal clients to clear cache
        res.setHeader("X-Cache-Invalidate", "landing-stats,story-stats");
        res.setHeader("X-Cache-Reason", "story-updated");

        return res.status(200).json({
          success: true,
          message: "Story updated successfully",
          story: {
            id: updatedStory.storyId,
            title: updatedStory.title,
            author: updatedStory.author,
            category: updatedStory.category,
            isPublished: updatedStory.published,
          },
          cacheInvalidation: {
            clearCache: true,
            reason: "story-updated",
          },
        });

      case "DELETE":
        console.log(`[STORY API] Deleting story ${id}`);

        const deletedStory = await Story.findOneAndDelete({ storyId: id });
        if (!deletedStory) {
          return res.status(404).json({
            success: false,
            message: "Story not found",
          });
        }

        console.log(`[STORY API] ✅ Deleted story ${id}`);

        return res.status(200).json({
          success: true,
          message: "Story deleted successfully",
        });

      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[STORY API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
