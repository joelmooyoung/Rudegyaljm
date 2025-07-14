import { RequestHandler } from "express";
import { Story, StoryRequest } from "@shared/api";
import { loadStories, saveStories } from "../utils/dataStore";

// Load stories from JSON file
export let stories: Story[] = loadStories();

// Helper function to log errors
const logError = (
  error: string,
  req: any,
  severity: "low" | "medium" | "high" | "critical" = "medium",
): void => {
  console.error(
    `[${severity.toUpperCase()}] ${req.method} ${req.originalUrl}: ${error}`,
  );
};

// GET /api/stories - Get all stories
export const getStories: RequestHandler = (req, res) => {
  try {
    // Reload stories from JSON to get latest data
    stories = loadStories();
    console.log(`[DEBUG] Total stories in database: ${stories.length}`);
    console.log(
      `[DEBUG] Stories:`,
      stories.map((s) => ({
        id: s.id,
        title: s.title,
        isPublished: s.isPublished,
        accessLevel: s.accessLevel,
      })),
    );

    // Sort by creation date (newest first)
    const sortedStories = [...stories].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    console.log(`[DEBUG] Returning ${sortedStories.length} stories`);
    res.json(sortedStories);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch stories";
    logError(`Error fetching stories: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/stories/:id - Get single story
export const getStory: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    // Reload stories from JSON to get latest data
    stories = loadStories();
    const story = stories.find((s) => s.id === id);

    if (!story) {
      logError(`Story not found: ${id}`, req, "medium");
      return res.status(404).json({ message: "Story not found" });
    }

    res.json(story);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch story";
    logError(`Error fetching story: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/stories - Create new story
export const createStory: RequestHandler = (req, res) => {
  try {
    const storyData: Partial<Story> = req.body;

    // Validate required fields
    if (!storyData.title || !storyData.author || !storyData.content) {
      logError("Missing required fields for story creation", req, "medium");
      return res
        .status(400)
        .json({ message: "Title, author, and content are required" });
    }

    // Reload stories to get latest data
    stories = loadStories();

    // Create new story with generated ID
    const newStory: Story = {
      id: Date.now().toString(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    stories.push(newStory);
    saveStories(stories);
    console.log(`[DEBUG] Story created. Total stories now: ${stories.length}`);
    console.log(`[DEBUG] New story:`, {
      id: newStory.id,
      title: newStory.title,
      isPublished: newStory.isPublished,
    });

    res.status(201).json(newStory);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create story";
    logError(`Error creating story: ${errorMessage}`, req, "critical");
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/stories/:id - Update story
export const updateStory: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const storyData: Partial<Story> = req.body;

    // Reload stories to get latest data
    stories = loadStories();
    const storyIndex = stories.findIndex((s) => s.id === id);
    if (storyIndex === -1) {
      logError(`Story not found for update: ${id}`, req, "medium");
      return res.status(404).json({ message: "Story not found" });
    }

    // Update story while preserving creation date and ID
    const updatedStory: Story = {
      ...stories[storyIndex],
      ...storyData,
      id: stories[storyIndex].id, // Preserve original ID
      createdAt: stories[storyIndex].createdAt, // Preserve creation date
      updatedAt: new Date(),
    };

    stories[storyIndex] = updatedStory;
    saveStories(stories);

    res.json(updatedStory);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update story";
    logError(`Error updating story: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/stories/:id - Delete story
export const deleteStory: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    // Reload stories to get latest data
    stories = loadStories();
    const storyIndex = stories.findIndex((s) => s.id === id);

    if (storyIndex === -1) {
      logError(`Story not found for deletion: ${id}`, req, "medium");
      return res.status(404).json({ message: "Story not found" });
    }

    const deletedStory = stories.splice(storyIndex, 1)[0];
    saveStories(stories);

    res.json({ message: "Story deleted successfully", story: deletedStory });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete story";
    logError(`Error deleting story: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/stories/:id/publish - Toggle publish status
export const togglePublishStory: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    // Reload stories to get latest data
    stories = loadStories();
    const storyIndex = stories.findIndex((s) => s.id === id);

    if (storyIndex === -1) {
      logError(`Story not found for publish toggle: ${id}`, req, "medium");
      return res.status(404).json({ message: "Story not found" });
    }

    stories[storyIndex].isPublished = !stories[storyIndex].isPublished;
    stories[storyIndex].updatedAt = new Date();
    saveStories(stories);

    res.json(stories[storyIndex]);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to toggle story publish status";
    logError(
      `Error toggling story publish status: ${errorMessage}`,
      req,
      "high",
    );
    res.status(500).json({ message: "Internal server error" });
  }
};
