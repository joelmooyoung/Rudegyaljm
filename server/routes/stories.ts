import { RequestHandler } from "express";
import { Story, StoryRequest } from "@shared/api";

// Mock database storage (replace with real database in production)
let stories: Story[] = [
  {
    id: "1",
    title: "Midnight Desires",
    excerpt:
      "A passionate tale of forbidden romance that unfolds under the cover of darkness...",
    content:
      "<p>In the depths of the city night, <strong>Emma</strong> discovered that some secrets are worth keeping...</p>",
    author: "Elena Rossini",
    category: "Romance",
    tags: ["passion", "forbidden", "dark"],
    accessLevel: "free",
    isPublished: true,
    rating: 4.8,
    ratingCount: 234,
    viewCount: 1542,
    imageUrl:
      "https://images.unsplash.com/photo-1518136247453-74e7b5265980?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "The Executive's Secret",
    excerpt:
      "Power, money, and desire collide in this steamy corporate thriller...",
    content:
      "<p>Marcus Steel ruled the boardroom by day, but at night, his desires led him down a different path...</p>",
    author: "Marcus Steel",
    category: "Mystery",
    tags: ["corporate", "power", "secrets"],
    accessLevel: "premium",
    isPublished: true,
    rating: 4.9,
    ratingCount: 156,
    viewCount: 892,
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    title: "Summer Heat",
    excerpt:
      "A vacation romance that turns into something much more intense...",
    content:
      "<p>What started as a simple beach vacation became the adventure of a lifetime...</p>",
    author: "Sofia Martinez",
    category: "Romance",
    tags: ["vacation", "summer", "romance"],
    accessLevel: "free",
    isPublished: true,
    rating: 4.6,
    ratingCount: 89,
    viewCount: 456,
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
  },
  {
    id: "4",
    title: "Dragons of Eldoria",
    excerpt:
      "In a world where dragons rule the skies, one woman must choose between love and duty...",
    content:
      "<p>The ancient prophecy spoke of a chosen one who would bridge two worlds...</p>",
    author: "J.R. Windham",
    category: "Fantasy",
    tags: ["dragons", "magic", "prophecy"],
    accessLevel: "premium",
    isPublished: false,
    rating: 4.2,
    ratingCount: 67,
    viewCount: 234,
    imageUrl:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-06"),
  },
  {
    id: "5",
    title: "The Comedy Club Catastrophe",
    excerpt:
      "When the lights go out at the comedy club, the real show begins...",
    content:
      "<p>Nobody expected the evening to end with a mystery that would change everything...</p>",
    author: "Danny Laughs",
    category: "Comedy",
    tags: ["humor", "mystery", "club"],
    accessLevel: "free",
    isPublished: true,
    rating: 4.4,
    ratingCount: 123,
    viewCount: 789,
    imageUrl:
      "https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  },
  {
    id: "6",
    title: "Whispers in the Library",
    excerpt: "Some books contain more than just words...",
    content:
      "<p>The old library held secrets that had been buried for decades...</p>",
    author: "Margaret Ashworth",
    category: "Mystery",
    tags: ["library", "secrets", "supernatural"],
    accessLevel: "premium",
    isPublished: true,
    rating: 4.7,
    ratingCount: 198,
    viewCount: 1123,
    imageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
  },
];

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
      imageUrl: storyData.imageUrl || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    stories.push(newStory);
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
    const storyIndex = stories.findIndex((s) => s.id === id);

    if (storyIndex === -1) {
      logError(`Story not found for deletion: ${id}`, req, "medium");
      return res.status(404).json({ message: "Story not found" });
    }

    const deletedStory = stories.splice(storyIndex, 1)[0];

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
    const storyIndex = stories.findIndex((s) => s.id === id);

    if (storyIndex === -1) {
      logError(`Story not found for publish toggle: ${id}`, req, "medium");
      return res.status(404).json({ message: "Story not found" });
    }

    stories[storyIndex].isPublished = !stories[storyIndex].isPublished;
    stories[storyIndex].updatedAt = new Date();

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
