// Admin Story management API with MongoDB integration
import { connectToDatabase } from "../../lib/mongodb.js";
import { Story } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[ADMIN STORIES API] ${req.method} /api/admin/stories`);
  console.log(`[ADMIN STORIES API] Body:`, req.body);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { method } = req;
  const { id } = req.query;

  try {
    // Connect to MongoDB
    const dbConnection = await connectToDatabase();

    if (!dbConnection.isConnected) {
      console.log("📊 Using fallback data - no database connection");
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    switch (method) {
      case "GET":
        if (id) {
          // Get single story
          const story = await Story.findOne({ storyId: id });
          if (!story) {
            return res.status(404).json({ message: "Story not found" });
          }

          // Transform to frontend format
          const transformedStory = {
            id: story.storyId,
            title: story.title,
            author: story.author,
            excerpt: story.excerpt,
            content: story.content,
            tags: story.tags,
            category: story.category,
            accessLevel: story.accessLevel,
            isPublished: story.published,
            rating: story.averageRating,
            ratingCount: story.ratingCount,
            viewCount: story.views,
            commentCount: story.commentCount,
            image: story.image,
            createdAt: story.createdAt,
            updatedAt: story.updatedAt,
          };

          res.json(transformedStory);
        } else {
          // Get all stories (including unpublished for admin)
          const allStories = await Story.find({}).sort({ createdAt: -1 });

          // Transform to frontend format
          const transformedStories = allStories.map((story) => ({
            id: story.storyId,
            title: story.title,
            author: story.author,
            excerpt: story.excerpt,
            content: story.content,
            tags: story.tags,
            category: story.category,
            accessLevel: story.accessLevel,
            isPublished: story.published,
            rating: story.averageRating,
            ratingCount: story.ratingCount,
            viewCount: story.views,
            commentCount: story.commentCount,
            image: story.image,
            createdAt: story.createdAt,
            updatedAt: story.updatedAt,
          }));

          res.json(transformedStories);
        }
        break;

      case "POST":
        // Create new story
        console.log("Creating new story:", req.body);

        const {
          title,
          content,
          author,
          category,
          tags,
          image,
          excerpt,
          accessLevel = "free",
          published = false,
          viewCount = 0,
          rating = 0,
          ratingCount = 0,
        } = req.body;

        if (!title || !content || !author || !category) {
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
          image,
          excerpt,
          accessLevel,
          published,
          featured: false,
          views: viewCount,
          likeCount: 0,
          averageRating: rating,
          ratingCount: ratingCount,
        });

        await newStory.save();
        console.log("Story created successfully:", newStory.storyId);
        res.status(201).json({
          id: newStory.storyId,
          title: newStory.title,
          author: newStory.author,
          category: newStory.category,
          published: newStory.published,
        });
        break;

      case "PUT":
        // Update story
        if (!id) {
          return res.status(400).json({ message: "Story ID required" });
        }
        console.log("Updating story:", id, req.body);

        const existingStory = await Story.findOne({ storyId: id });
        if (!existingStory) {
          return res.status(404).json({ message: "Story not found" });
        }

        // Update fields
        const updateFields = {};
        if (req.body.title) updateFields.title = req.body.title;
        if (req.body.content) updateFields.content = req.body.content;
        if (req.body.author) updateFields.author = req.body.author;
        if (req.body.category) updateFields.category = req.body.category;
        if (req.body.tags)
          updateFields.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
        if (req.body.image !== undefined) updateFields.image = req.body.image;
        if (req.body.excerpt) updateFields.excerpt = req.body.excerpt;
        if (req.body.accessLevel)
          updateFields.accessLevel = req.body.accessLevel;
        if (req.body.hasOwnProperty("published"))
          updateFields.published = req.body.published;
        if (req.body.hasOwnProperty("viewCount"))
          updateFields.views = req.body.viewCount;
        if (req.body.hasOwnProperty("rating"))
          updateFields.averageRating = req.body.rating;
        if (req.body.hasOwnProperty("ratingCount"))
          updateFields.ratingCount = req.body.ratingCount;

        const updatedStory = await Story.findOneAndUpdate(
          { storyId: id },
          updateFields,
          { new: true },
        );

        console.log("Story updated successfully:", id);
        res.json({
          id: updatedStory.storyId,
          title: updatedStory.title,
          author: updatedStory.author,
          category: updatedStory.category,
          published: updatedStory.published,
        });
        break;

      case "DELETE":
        // Delete story
        if (!id) {
          return res.status(400).json({ message: "Story ID required" });
        }
        console.log("Deleting story:", id);

        const deletedStory = await Story.findOneAndDelete({ storyId: id });
        if (!deletedStory) {
          return res.status(404).json({ message: "Story not found" });
        }

        console.log("Story deleted successfully:", id);
        res.json({ message: "Story deleted successfully" });
        break;

      default:
        res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Admin story management error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
