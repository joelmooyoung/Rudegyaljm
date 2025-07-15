// Production-ready Stories API with MongoDB integration
import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[STORIES API] ${req.method} /api/stories`);
  console.log(`[STORIES API] Body:`, req.body);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Connect to MongoDB
    await connectToDatabase();

    switch (req.method) {
      case "GET":
        console.log(`[STORIES API] Fetching all stories`);

        const stories = await Story.find({ published: true })
          .sort({ createdAt: -1 })
          .select("-__v");

        // Transform MongoDB documents to frontend format
        const transformedStories = stories.map((story) => ({
          id: story.storyId,
          title: story.title,
          author: story.author,
          excerpt: story.content.substring(0, 200) + "...",
          content: story.content,
          tags: story.tags,
          category: story.category,
          accessLevel: "free", // Default for compatibility
          isPublished: story.published,
          rating: story.averageRating,
          ratingCount: story.ratingCount,
          viewCount: story.views,
          commentCount: 0, // Will be calculated separately if needed
          image: `https://images.unsplash.com/photo-${Math.random().toString(36).substr(2, 9)}?w=800&q=80`,
          createdAt: story.createdAt,
          updatedAt: story.updatedAt,
        }));

        console.log(
          `[STORIES API] Found ${transformedStories.length} published stories`,
        );
        return res.status(200).json(transformedStories);

      case "POST":
        console.log(`[STORIES API] Creating new story`);
        console.log(`[STORIES API] Request body:`, req.body);

        const {
          title,
          content,
          author,
          category,
          tags,
          published = false,
        } = req.body;

        if (!title || !content || !author || !category) {
          console.log(`[STORIES API] Missing required fields`);
          return res.status(400).json({
            success: false,
            message: "Title, content, author, and category are required",
          });
        }

        const storyId = Date.now().toString();
        const newStory = new Story({
          storyId,
          title,
          content,
          author,
          category,
          tags: Array.isArray(tags) ? tags : [],
          published,
          featured: false,
          views: 0,
          likeCount: 0,
          averageRating: 0,
          ratingCount: 0,
        });

        await newStory.save();
        console.log(`[STORIES API] ✅ Created story ${storyId}`);

        return res.status(201).json({
          success: true,
          message: "Story created successfully",
          data: {
            id: newStory.storyId,
            title: newStory.title,
            author: newStory.author,
            category: newStory.category,
            published: newStory.published,
          },
        });

      case "PUT":
        console.log(`[STORIES API] Updating story`);
        const { id: updateId } = req.body;

        if (!updateId) {
          return res.status(400).json({
            success: false,
            message: "Story ID is required",
          });
        }

        const existingStory = await Story.findOne({ storyId: updateId });
        if (!existingStory) {
          return res.status(404).json({
            success: false,
            message: "Story not found",
          });
        }

        // Update fields
        const updateFields = {};
        if (req.body.title) updateFields.title = req.body.title;
        if (req.body.content) updateFields.content = req.body.content;
        if (req.body.author) updateFields.author = req.body.author;
        if (req.body.category) updateFields.category = req.body.category;
        if (req.body.tags)
          updateFields.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
        if (req.body.hasOwnProperty("published"))
          updateFields.published = req.body.published;

        const updatedStory = await Story.findOneAndUpdate(
          { storyId: updateId },
          updateFields,
          { new: true },
        );

        console.log(`[STORIES API] ✅ Updated story ${updateId}`);

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

      case "DELETE":
        console.log(`[STORIES API] Deleting story`);
        const { id: deleteId } = req.body;

        if (!deleteId) {
          return res.status(400).json({
            success: false,
            message: "Story ID is required",
          });
        }

        const deletedStory = await Story.findOneAndDelete({
          storyId: deleteId,
        });
        if (!deletedStory) {
          return res.status(404).json({
            success: false,
            message: "Story not found",
          });
        }

        console.log(`[STORIES API] ✅ Deleted story ${deleteId}`);

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
    console.error(`[STORIES API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
