// Production-ready Stories API with MongoDB integration
import { connectToDatabase } from "../lib/mongodb.js";
import { Story, Comment } from "../models/index.js";

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
        console.log(`[STORIES API] Fetching stories`);

        // Check if request includes admin parameter to get all stories (published and unpublished)
        const includeUnpublished = req.query.admin === 'true' || req.query.includeUnpublished === 'true';

        // For admin requests, get all stories; for public requests, only published
        const query = includeUnpublished ? {} : { published: true };
        console.log(`[STORIES API] Query filter:`, query, `(includeUnpublished: ${includeUnpublished})`);

        // For admin requests, use minimal fields for fast loading
        const selectFields = includeUnpublished
          ? "storyId title author category published featured viewCount likeCount rating ratingCount commentCount createdAt updatedAt"
          : "-__v";

        // For admin requests, add pagination to improve performance
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || (includeUnpublished ? 20 : 50); // Smaller limit for admin
        const skip = (page - 1) * limit;

        console.log(`[STORIES API] Fetching page ${page}, limit ${limit}, skip ${skip}`);

        const stories = await Story.find(query)
          .sort({ createdAt: -1 })
          .select(selectFields)
          .skip(skip)
          .limit(limit);

        // For admin requests, skip real-time comment counts for faster response
        console.log(`[STORIES API] Fast admin mode - using stored comment counts for ${stories.length} stories`);

        // Transform MongoDB documents to frontend format using production data
        const transformedStories = stories.map((story) => {
            const storyObj = story.toObject();

            // For admin interface, use stored comment count for speed
            const commentCount = storyObj.commentCount || 0;

            // Safely handle all data types to prevent JSON serialization issues
            const result = {
              id: story.storyId || 'unknown',
              title: story.title || 'Untitled',
              author: story.author || 'Unknown Author',
              excerpt: 'Loading...', // Simplified for admin interface
              tags: [], // Simplified for admin interface
              category: story.category || 'Unknown',
              accessLevel: "free", // Default for admin interface
              isPublished: Boolean(story.published),
              // Use production statistics from MongoDB (use raw object to ensure we get actual values)
              rating: Number(storyObj.rating || 0),
              ratingCount: Number(storyObj.ratingCount || 0),
              viewCount: Number(storyObj.viewCount || 0),
              commentCount: Number(commentCount || 0),
              likeCount: Number(storyObj.likeCount || 0),
              image: null, // Simplified for admin interface
              audioUrl: null, // Simplified for admin interface
              createdAt: story.createdAt ? story.createdAt.toISOString() : new Date().toISOString(),
              updatedAt: story.updatedAt ? story.updatedAt.toISOString() : new Date().toISOString(),
            };

            // Only include content for non-admin requests (to keep response size manageable)
            if (!includeUnpublished && story.content) {
              result.content = story.content;
            }

            return result;
        });

        console.log(
          `[STORIES API] Found ${transformedStories.length} stories (includeUnpublished: ${includeUnpublished})`,
        );

        // Test JSON serialization before sending response
        try {
          const testSerialization = JSON.stringify(transformedStories);
          console.log(`[STORIES API] JSON serialization test passed (${testSerialization.length} chars)`);
        } catch (serializationError) {
          console.error(`[STORIES API] JSON serialization failed:`, serializationError);

          // Find problematic story
          for (let i = 0; i < transformedStories.length; i++) {
            try {
              JSON.stringify(transformedStories[i]);
            } catch (storyError) {
              console.error(`[STORIES API] Story ${i} (${transformedStories[i]?.id}) failed serialization:`, storyError);
              // Remove problematic story
              transformedStories.splice(i, 1);
              i--; // Adjust index after removal
            }
          }

          console.log(`[STORIES API] Removed problematic stories, returning ${transformedStories.length} stories`);
        }

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
          viewCount: viewCount,
          likeCount: 0,
          rating: rating,
          ratingCount: ratingCount,
        });

        await newStory.save();
        console.log(`[STORIES API] ✅ Created story ${storyId}`);

        // Add cache invalidation header to signal clients to clear cache
        res.setHeader("X-Cache-Invalidate", "landing-stats");
        res.setHeader("X-Cache-Reason", "story-created");

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
          cacheInvalidation: {
            clearCache: true,
            reason: "story-created"
          }
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
          updateFields.viewCount = req.body.viewCount;
        if (req.body.hasOwnProperty("rating"))
          updateFields.rating = req.body.rating;
        if (req.body.hasOwnProperty("ratingCount"))
          updateFields.ratingCount = req.body.ratingCount;

        const updatedStory = await Story.findOneAndUpdate(
          { storyId: updateId },
          updateFields,
          { new: true },
        );

        console.log(`[STORIES API] ✅ Updated story ${updateId}`);

        // Add cache invalidation header to signal clients to clear cache
        res.setHeader("X-Cache-Invalidate", "landing-stats");
        res.setHeader("X-Cache-Reason", "story-updated");

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
          cacheInvalidation: {
            clearCache: true,
            reason: "story-updated"
          }
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

        // Add cache invalidation header to signal clients to clear cache
        res.setHeader("X-Cache-Invalidate", "landing-stats");
        res.setHeader("X-Cache-Reason", "story-deleted");

        return res.status(200).json({
          success: true,
          message: "Story deleted successfully",
          cacheInvalidation: {
            clearCache: true,
            reason: "story-deleted"
          }
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
