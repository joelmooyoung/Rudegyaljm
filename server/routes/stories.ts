import { RequestHandler } from "express";
import { Story, StoryRequest } from "@shared/api";
import { StoryModel, ErrorLogModel, toStoryResponse } from "../models";
import { triggerStoryCacheInvalidation } from "../lib/cache-manager.js";

// Helper function to log errors to MongoDB
const logError = async (
  error: string,
  req: any,
  severity: "low" | "medium" | "high" | "critical" = "medium",
): Promise<void> => {
  try {
    const errorLog = new ErrorLogModel({
      error,
      endpoint: req.originalUrl,
      method: req.method,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
      userAgent: req.get("User-Agent") || "unknown",
      severity,
    });

    await errorLog.save();
    console.error(
      `[${severity.toUpperCase()}] ${req.method} ${req.originalUrl}: ${error}`,
    );
  } catch (logErr) {
    console.error("Failed to log error to database:", logErr);
  }
};

// GET /api/stories - Get all stories
export const getStories: RequestHandler = async (req, res) => {
  try {
    const stories = await StoryModel.find().sort({ createdAt: -1 });

    console.log(`[DEBUG] Total stories in database: ${stories.length}`);
    console.log(
      `[DEBUG] Stories:`,
      stories.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        isPublished: s.isPublished,
        accessLevel: s.accessLevel,
      })),
    );

    const response = stories.map(toStoryResponse);
    console.log(`[DEBUG] Returning ${response.length} stories`);
    res.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch stories";
    await logError(`Error fetching stories: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/stories/:id - Get single story
export const getStory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await StoryModel.findById(id);

    if (!story) {
      await logError(`Story not found: ${id}`, req, "medium");
      return res.status(404).json({ message: "Story not found" });
    }

    // Increment view count
    story.viewCount += 1;
    await story.save();

    res.json(toStoryResponse(story));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch story";
    await logError(`Error fetching story: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/stories - Create new story
export const createStory: RequestHandler = async (req, res) => {
  try {
    const storyData: Partial<Story> = req.body;

    // Validate required fields
    if (!storyData.title || !storyData.author || !storyData.content) {
      await logError(
        "Missing required fields for story creation",
        req,
        "medium",
      );
      return res
        .status(400)
        .json({ message: "Title, author, and content are required" });
    }

    // Create new story
    const newStory = new StoryModel({
      title: storyData.title,
      excerpt: storyData.excerpt || "",
      content: storyData.content,
      author: storyData.author,
      category: storyData.category || "Free",
      tags: storyData.tags || [],
      accessLevel: storyData.accessLevel || "free",
      isPublished:
        storyData.isPublished !== undefined ? storyData.isPublished : true,
      rating: storyData.rating || 0,
      ratingCount: storyData.ratingCount || 0,
      viewCount: storyData.viewCount || 0,
      commentCount: storyData.commentCount || 0,
      image: storyData.image || undefined,
    });

    const savedStory = await newStory.save();

    console.log(`[DEBUG] Story created with ID: ${savedStory._id}`);
    console.log(`[DEBUG] New story:`, {
      id: savedStory._id.toString(),
      title: savedStory.title,
      isPublished: savedStory.isPublished,
    });

    res.status(201).json(toStoryResponse(savedStory));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create story";
    await logError(`Error creating story: ${errorMessage}`, req, "critical");
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/stories/:id - Update story
export const updateStory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const storyData: Partial<Story> = req.body;

    const story = await StoryModel.findById(id);
    if (!story) {
      await logError(`Story not found for update: ${id}`, req, "medium");
      return res.status(404).json({ message: "Story not found" });
    }

    // Update story fields
    Object.assign(story, storyData);
    const updatedStory = await story.save();

    res.json(toStoryResponse(updatedStory));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update story";
    await logError(`Error updating story: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/stories/:id - Delete story
export const deleteStory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await StoryModel.findById(id);

    if (!story) {
      await logError(`Story not found for deletion: ${id}`, req, "medium");
      return res.status(404).json({ message: "Story not found" });
    }

    await StoryModel.findByIdAndDelete(id);

    res.json({
      message: "Story deleted successfully",
      story: toStoryResponse(story),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete story";
    await logError(`Error deleting story: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/stories/:id/publish - Toggle publish status
export const togglePublishStory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await StoryModel.findById(id);

    if (!story) {
      await logError(
        `Story not found for publish toggle: ${id}`,
        req,
        "medium",
      );
      return res.status(404).json({ message: "Story not found" });
    }

    story.isPublished = !story.isPublished;
    const updatedStory = await story.save();

    res.json(toStoryResponse(updatedStory));
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to toggle story publish status";
    await logError(
      `Error toggling story publish status: ${errorMessage}`,
      req,
      "high",
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/stories/search - Search stories
export const searchStories: RequestHandler = async (req, res) => {
  try {
    const { q, category, accessLevel, published } = req.query;

    let query: any = {};

    // Text search
    if (q) {
      query.$text = { $search: q as string };
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Access level filter
    if (accessLevel && accessLevel !== "all") {
      query.accessLevel = accessLevel;
    }

    // Published filter
    if (published !== undefined) {
      query.isPublished = published === "true";
    }

    const stories = await StoryModel.find(query).sort({ createdAt: -1 });
    const response = stories.map(toStoryResponse);

    res.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to search stories";
    await logError(`Error searching stories: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};
