<<<<<<< HEAD
// Production-ready Stories API with MongoDB integration
import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[STORIES API] ${req.method} /api/stories`);
=======
import { db } from "../lib/supabase.js";

export default async function handler(req, res) {
  console.log(`[STORIES API] ${req.method} /api/stories`);
  console.log(`[STORIES API] Query:`, req.query);
>>>>>>> 5a56b8ea6e425b9ec097296fbb24a05ee5163ac4
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
<<<<<<< HEAD
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

=======
    switch (req.method) {
      case "GET":
        return await handleGetStories(req, res);
      case "POST":
        return await handleCreateStory(req, res);
      case "PUT":
        return await handleUpdateStory(req, res);
      case "DELETE":
        return await handleDeleteStory(req, res);
>>>>>>> 5a56b8ea6e425b9ec097296fbb24a05ee5163ac4
      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[STORIES API] Error:`, error);
<<<<<<< HEAD
=======

    // Log error to database
    try {
      await db.logError({
        error_type: "STORIES_API_ERROR",
        error_message: error.message,
        stack_trace: error.stack,
        request_path: "/api/stories",
      });
    } catch (logError) {
      console.error(`[STORIES API] Failed to log error:`, logError);
    }

>>>>>>> 5a56b8ea6e425b9ec097296fbb24a05ee5163ac4
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
<<<<<<< HEAD
=======
  }
}

async function handleGetStories(req, res) {
  console.log(`[STORIES API] Getting stories`);

  const { published, featured, author } = req.query;

  const filters = {};
  if (published !== undefined) {
    filters.published = published === "true";
  }
  if (featured !== undefined) {
    filters.featured = featured === "true";
  }
  if (author) {
    filters.authorId = author;
  }

  const stories = await db.getStories(filters);

  console.log(`[STORIES API] Found ${stories.length} stories`);

  // Return direct array for frontend compatibility
  return res.status(200).json(stories);
}

async function handleCreateStory(req, res) {
  console.log(`[STORIES API] Creating new story`);

  const {
    title,
    content,
    authorId,
    category,
    tags,
    isPublished = false,
    isFeatured = false,
  } = req.body;

  // Validation
  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: "Title and content are required",
    });
  }

  // Process tags - ensure it's an array
  let processedTags = [];
  if (tags) {
    if (typeof tags === "string") {
      processedTags = tags.split(",").map((tag) => tag.trim());
    } else if (Array.isArray(tags)) {
      processedTags = tags;
    }
  }

  const storyData = {
    title,
    content,
    author_id: authorId,
    category: category || null,
    tags: processedTags,
    is_published: isPublished,
    is_featured: isFeatured,
    view_count: 0,
  };

  const newStory = await db.createStory(storyData);

  console.log(`[STORIES API] ✅ Created story ${newStory.id}: ${title}`);

  return res.status(201).json({
    success: true,
    message: "Story created successfully",
    data: newStory,
  });
}

async function handleUpdateStory(req, res) {
  console.log(`[STORIES API] Updating story`);

  const { id, title, content, category, tags, isPublished, isFeatured } =
    req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Story ID is required",
    });
  }

  // Build update object
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (category !== undefined) updates.category = category;
  if (isPublished !== undefined) updates.is_published = isPublished;
  if (isFeatured !== undefined) updates.is_featured = isFeatured;

  // Process tags
  if (tags !== undefined) {
    if (typeof tags === "string") {
      updates.tags = tags.split(",").map((tag) => tag.trim());
    } else if (Array.isArray(tags)) {
      updates.tags = tags;
    } else {
      updates.tags = [];
    }
  }

  const updatedStory = await db.updateStory(id, updates);

  console.log(`[STORIES API] ✅ Updated story ${id}: ${updatedStory.title}`);

  return res.status(200).json({
    success: true,
    message: "Story updated successfully",
    data: updatedStory,
  });
}

async function handleDeleteStory(req, res) {
  console.log(`[STORIES API] Deleting story`);

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Story ID is required",
    });
  }

  try {
    // Get story first to verify it exists
    const story = await db.getStory(id);

    // Delete the story (cascade will handle related data)
    const { error } = await db
      .getSupabaseAdmin()
      .from("stories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    console.log(`[STORIES API] ✅ Deleted story ${id}: ${story.title}`);

    return res.status(200).json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    if (error.code === "PGRST116") {
      // Story not found
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }
    throw error;
>>>>>>> 5a56b8ea6e425b9ec097296fbb24a05ee5163ac4
  }
}
