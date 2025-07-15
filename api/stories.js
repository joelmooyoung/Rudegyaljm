import { db } from "../lib/supabase.js";

export default async function handler(req, res) {
  console.log(`[STORIES API] ${req.method} /api/stories`);
  console.log(`[STORIES API] Query:`, req.query);
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
    switch (req.method) {
      case "GET":
        return await handleGetStories(req, res);
      case "POST":
        return await handleCreateStory(req, res);
      case "PUT":
        return await handleUpdateStory(req, res);
      case "DELETE":
        return await handleDeleteStory(req, res);
      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[STORIES API] Error:`, error);

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

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
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
  }
}
