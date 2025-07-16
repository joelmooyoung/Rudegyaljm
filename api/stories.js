import { db } from "../lib/supabase.js";

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
    switch (req.method) {
      case "GET":
        console.log(`[STORIES API] Fetching all stories`);

        const stories = await db.getStories({ published: true });

        // Transform to frontend format
        const transformedStories = stories.map((story) => ({
          id: story.id,
          title: story.title,
          author: story.author?.username || "Unknown",
          excerpt: story.content.substring(0, 200) + "...",
          content: story.content,
          tags: story.tags || [],
          category: story.category,
          accessLevel: "free", // Default for compatibility
          isPublished: story.is_published,
          rating: story.averageRating || 0,
          ratingCount: story.ratingCount || 0,
          viewCount: story.view_count || 0,
          commentCount: story.comments?.length || 0,
          image: `https://images.unsplash.com/photo-${Math.random().toString(36).substr(2, 9)}?w=800&q=80`,
          createdAt: story.created_at,
          updatedAt: story.updated_at,
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
          author_id,
          category,
          tags,
          is_published = false,
        } = req.body;

        if (!title || !content || !author_id || !category) {
          console.log(`[STORIES API] Missing required fields`);
          return res.status(400).json({
            success: false,
            message: "Title, content, author_id, and category are required",
          });
        }

        const newStory = await db.createStory({
          title,
          content,
          author_id,
          category,
          tags: tags || [],
          is_published,
          is_featured: false,
          view_count: 0,
        });

        console.log(`[STORIES API] ✅ Created story ${newStory.id}`);

        return res.status(201).json({
          success: true,
          message: "Story created successfully",
          data: {
            id: newStory.id,
            title: newStory.title,
            author_id: newStory.author_id,
            category: newStory.category,
            is_published: newStory.is_published,
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

        // Update fields
        const updateFields = {};
        if (req.body.title) updateFields.title = req.body.title;
        if (req.body.content) updateFields.content = req.body.content;
        if (req.body.category) updateFields.category = req.body.category;
        if (req.body.tags) updateFields.tags = req.body.tags;
        if (req.body.hasOwnProperty("is_published"))
          updateFields.is_published = req.body.is_published;

        const updatedStory = await db.updateStory(updateId, updateFields);

        console.log(`[STORIES API] ✅ Updated story ${updateId}`);

        return res.status(200).json({
          success: true,
          message: "Story updated successfully",
          data: {
            id: updatedStory.id,
            title: updatedStory.title,
            category: updatedStory.category,
            is_published: updatedStory.is_published,
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

        await db.getSupabaseAdmin().from("stories").delete().eq("id", deleteId);

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
