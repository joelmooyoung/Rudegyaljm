// Production-ready Stories API with MongoDB integration
import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";
import { getAllStats } from "../lib/story-stats.js";

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
    // Connect to MongoDB with fallback handling
    const dbConnection = await connectToDatabase();

    if (!dbConnection.isConnected) {
      console.log("📊 Using fallback data - no database connection");

      // Return fallback data for development
      const fallbackStories = [
        {
          id: "dev-1",
          title: "Sample Story (No Database)",
          author: "Development",
          excerpt: "This is sample data because no database is connected...",
          content:
            "Sample content for development environment when database is not available.",
          tags: ["development", "sample"],
          category: "Sample",
          accessLevel: "free",
          isPublished: true,
          rating: 0,
          ratingCount: 0,
          viewCount: 0,
          commentCount: 0,
          image:
            "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&q=80",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      return res.status(200).json(fallbackStories);
    }

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
          excerpt: story.excerpt || story.content.substring(0, 200) + "...",
          content: story.content,
          tags: story.tags,
          category: story.category,
          accessLevel: story.accessLevel || "free",
          isPublished: story.published,
          rating: story.averageRating,
          ratingCount: story.ratingCount,
          viewCount: story.views,
          commentCount: story.commentCount || 0,
          likeCount: story.likeCount || 0,
          image: story.image, // Use actual image from database
          audioUrl: story.audioUrl, // Use actual audio from database
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
          image,
          audioUrl,
          excerpt,
          accessLevel = "free",
          published = false,
          viewCount = 0,
          rating = 0,
          ratingCount = 0,
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
          image,
          audioUrl,
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
        console.log(`[STORIES API] URL path:`, req.url);
        console.log(`[STORIES API] Request body:`, req.body);

        // Extract story ID from URL path /api/stories/story1
        const urlParts = req.url?.split("/");
        const urlStoryId = urlParts?.[urlParts.length - 1]?.split("?")[0];

        // Try URL parameter first, then body
        const updateId = urlStoryId || req.body.id;

        console.log(`[STORIES API] Extracted story ID:`, updateId);

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
