// Production-ready Stories API with complete CRUD operations
// This is the main stories endpoint that handles all operations

// In-memory storage (in production, this would be a database)
let stories = [
  {
    id: "1",
    title: "Midnight Desires",
    author: "Seductive Sage",
    excerpt:
      "In the velvet darkness of midnight, she discovered desires she never knew existed. A tale of passion that ignites the soul and awakens the deepest cravings of the heart.",
    content:
      "The city slept, but her heart was wide awake, pulsing with a rhythm she had never felt before. Under the moonlight streaming through her window, she made a decision that would change everything...",
    tags: ["Passionate", "Romance", "Midnight"],
    category: "Romance",
    accessLevel: "free",
    isPublished: true,
    rating: 4.8,
    ratingCount: 1247,
    viewCount: 15420,
    commentCount: 89,
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&q=80",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "The Executive's Secret",
    author: "Corporate Temptress",
    excerpt:
      "Behind the polished boardroom facade lies a world of forbidden desires. When power meets passion, boundaries dissolve into pure, intoxicating pleasure.",
    content:
      "The corner office held more secrets than quarterly reports. Between the mahogany desk and floor-to-ceiling windows, she learned that some negotiations happen after hours...",
    tags: ["Power", "Forbidden", "Executive"],
    category: "Passionate",
    accessLevel: "premium",
    isPublished: true,
    rating: 4.9,
    ratingCount: 892,
    viewCount: 8934,
    commentCount: 156,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "3",
    title: "Summer Heat",
    author: "Tropical Muse",
    excerpt:
      "Under the blazing sun, two souls collided in a symphony of sweat, desire, and uncontrollable attraction. A summer that changed everything.",
    content:
      "The beach was crowded, but in that moment, only two people existed under the scorching sun. The heat between them had nothing to do with the weather...",
    tags: ["Summer", "Heat", "Attraction"],
    category: "Romance",
    accessLevel: "free",
    isPublished: true,
    rating: 4.6,
    ratingCount: 567,
    viewCount: 12100,
    commentCount: 43,
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
];

export default async function handler(req, res) {
  const startTime = Date.now();

  // Log every request for debugging
  console.log(`\n🚀 [STORIES API] ${req.method} ${req.url}`);
  console.log(`📝 [STORIES API] Query:`, req.query);
  console.log(`📦 [STORIES API] Body:`, req.body);
  console.log(`🕐 [STORIES API] Timestamp: ${new Date().toISOString()}`);

  // Enable CORS for all requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    console.log(`✅ [STORIES API] OPTIONS preflight handled`);
    return res.status(200).end();
  }

  try {
    const { method, query, body } = req;

    // Extract story ID from query or URL path
    let storyId = query.id;
    if (!storyId && req.url) {
      const urlParts = req.url.split("/");
      const idIndex = urlParts.indexOf("stories") + 1;
      if (idIndex < urlParts.length && urlParts[idIndex] !== "") {
        storyId = urlParts[idIndex].split("?")[0]; // Remove query params
      }
    }

    console.log(
      `🎯 [STORIES API] Operation: ${method}, Story ID: ${storyId || "N/A"}`,
    );

    switch (method) {
      case "GET":
        if (storyId) {
          // Get single story by ID
          console.log(`📖 [STORIES API] Fetching single story: ${storyId}`);
          const story = stories.find((s) => s.id === storyId);

          if (!story) {
            console.log(`❌ [STORIES API] Story not found: ${storyId}`);
            return res.status(404).json({
              success: false,
              message: `Story with ID ${storyId} not found`,
              timestamp: new Date().toISOString(),
            });
          }

          console.log(`✅ [STORIES API] Found story: "${story.title}"`);
          return res.status(200).json({
            success: true,
            data: story,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Get all stories - return array directly for frontend compatibility
          console.log(
            `📚 [STORIES API] Fetching all stories (${stories.length} total)`,
          );

          // Validate stories array
          if (!Array.isArray(stories)) {
            console.error(
              `❌ [STORIES API] Stories is not an array:`,
              typeof stories,
            );
            return res.status(500).json({
              error: "Internal error: stories data is corrupted",
              type: typeof stories,
              value: stories,
            });
          }

          // Ensure all stories have required fields
          const validatedStories = stories.map((story) => ({
            ...story,
            id: story.id || Date.now().toString(),
            title: story.title || "Untitled",
            author: story.author || "Unknown Author",
            excerpt: story.excerpt || "",
            content: story.content || "",
            tags: Array.isArray(story.tags) ? story.tags : [],
            category: story.category || "Romance",
            accessLevel: story.accessLevel || "free",
            isPublished: Boolean(story.isPublished),
            rating: Number(story.rating) || 0,
            ratingCount: Number(story.ratingCount) || 0,
            viewCount: Number(story.viewCount) || 0,
            commentCount: Number(story.commentCount) || 0,
            createdAt: story.createdAt || new Date(),
            updatedAt: story.updatedAt || new Date(),
          }));

          console.log(
            `📋 [STORIES API] Returning ${validatedStories.length} validated stories as array`,
          );
          console.log(
            `🔍 [STORIES API] Sample story:`,
            validatedStories[0]
              ? {
                  id: validatedStories[0].id,
                  title: validatedStories[0].title,
                  author: validatedStories[0].author,
                }
              : "No stories available",
          );

          return res.status(200).json(validatedStories);
        }

      case "POST":
        // Create new story
        console.log(`➕ [STORIES API] Creating new story`);
        console.log(`📝 [STORIES API] Story data:`, body);

        // Validate required fields
        if (!body || !body.title) {
          console.log(`❌ [STORIES API] Validation failed: Missing title`);
          return res.status(400).json({
            success: false,
            message: "Story title is required",
            timestamp: new Date().toISOString(),
          });
        }

        const newStoryId = Date.now().toString();
        const newStory = {
          id: newStoryId,
          title: body.title || "Untitled Story",
          author: body.author || "Anonymous",
          excerpt: body.excerpt || "",
          content: body.content || "",
          tags: Array.isArray(body.tags)
            ? body.tags
            : body.tags
              ? body.tags.split(",").map((tag) => tag.trim())
              : [],
          category: body.category || "Romance",
          accessLevel: body.accessLevel || "free",
          isPublished: Boolean(body.isPublished),
          rating: Number(body.rating) || 0,
          ratingCount: Number(body.ratingCount) || 0,
          viewCount: Number(body.viewCount) || 0,
          commentCount: Number(body.commentCount) || 0,
          image: body.image || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        stories.push(newStory);
        console.log(
          `✅ [STORIES API] Created story "${newStory.title}" with ID: ${newStoryId}`,
        );
        console.log(`📊 [STORIES API] Total stories: ${stories.length}`);

        return res.status(201).json({
          success: true,
          message: "Story created successfully",
          data: newStory,
          timestamp: new Date().toISOString(),
        });

      case "PUT":
        // Update existing story
        if (!storyId) {
          console.log(`❌ [STORIES API] PUT request missing story ID`);
          return res.status(400).json({
            success: false,
            message: "Story ID is required for updates",
            timestamp: new Date().toISOString(),
          });
        }

        console.log(`📝 [STORIES API] ADMIN EDIT - Updating story ${storyId}`);
        console.log(`📦 [STORIES API] Original request body:`, body);
        console.log(
          `🔍 [STORIES API] Available stories:`,
          stories.map((s) => ({ id: s.id, title: s.title })),
        );

        const storyIndex = stories.findIndex((s) => s.id === storyId);
        if (storyIndex === -1) {
          console.log(
            `❌ [STORIES API] Story not found for update: ${storyId}`,
          );
          console.log(
            `📋 [STORIES API] Available story IDs:`,
            stories.map((s) => s.id),
          );
          return res.status(404).json({
            success: false,
            message: `Story with ID ${storyId} not found`,
            availableIds: stories.map((s) => s.id),
            timestamp: new Date().toISOString(),
          });
        }

        console.log(
          `🎯 [STORIES API] Found story to update:`,
          stories[storyIndex].title,
        );

        // Handle tags properly - support both array and string formats
        let processedTags = stories[storyIndex].tags; // Default to existing tags
        if (body.tags !== undefined) {
          if (Array.isArray(body.tags)) {
            processedTags = body.tags.filter((tag) => tag && tag.trim());
          } else if (typeof body.tags === "string") {
            processedTags = body.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag);
          }
        }

        // Update story while preserving ID and timestamps
        const updatedStory = {
          ...stories[storyIndex],
          ...body,
          id: storyId, // Ensure ID doesn't change
          createdAt: stories[storyIndex].createdAt, // Preserve creation date
          updatedAt: new Date(), // Update modified date
          tags: processedTags,
          // Ensure boolean fields are properly handled
          isPublished:
            body.isPublished !== undefined
              ? Boolean(body.isPublished)
              : stories[storyIndex].isPublished,
        };

        console.log(`🔧 [STORIES API] Processed update data:`, {
          id: updatedStory.id,
          title: updatedStory.title,
          author: updatedStory.author,
          category: updatedStory.category,
          accessLevel: updatedStory.accessLevel,
          isPublished: updatedStory.isPublished,
          tags: updatedStory.tags,
        });

        stories[storyIndex] = updatedStory;
        console.log(
          `✅ [STORIES API] ADMIN EDIT SUCCESS - Updated story "${updatedStory.title}" (ID: ${storyId})`,
        );

        return res.status(200).json({
          success: true,
          message: "Story updated successfully by administrator",
          data: updatedStory,
          changes: Object.keys(body),
          timestamp: new Date().toISOString(),
        });

      case "DELETE":
        // Delete story
        if (!storyId) {
          console.log(`❌ [STORIES API] DELETE request missing story ID`);
          return res.status(400).json({
            success: false,
            message: "Story ID is required for deletion",
            timestamp: new Date().toISOString(),
          });
        }

        console.log(`🗑️ [STORIES API] Deleting story ${storyId}`);

        const deleteIndex = stories.findIndex((s) => s.id === storyId);
        if (deleteIndex === -1) {
          console.log(
            `❌ [STORIES API] Story not found for deletion: ${storyId}`,
          );
          return res.status(404).json({
            success: false,
            message: `Story with ID ${storyId} not found`,
            timestamp: new Date().toISOString(),
          });
        }

        const deletedStory = stories[deleteIndex];
        stories.splice(deleteIndex, 1);
        console.log(
          `✅ [STORIES API] Deleted story "${deletedStory.title}" (ID: ${storyId})`,
        );
        console.log(`📊 [STORIES API] Remaining stories: ${stories.length}`);

        return res.status(200).json({
          success: true,
          message: "Story deleted successfully",
          deletedStory: { id: storyId, title: deletedStory.title },
          timestamp: new Date().toISOString(),
        });

      default:
        console.log(`❌ [STORIES API] Method not allowed: ${method}`);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`,
          allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [STORIES API] ERROR after ${duration}ms:`, error);
    console.error(`📍 [STORIES API] Error stack:`, error.stack);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
    });
  } finally {
    const duration = Date.now() - startTime;
    console.log(`⏱️ [STORIES API] Request completed in ${duration}ms\n`);
  }
}
