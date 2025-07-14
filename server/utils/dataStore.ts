import fs from "fs";
import path from "path";
import { Story, Comment } from "@shared/api";

// Data storage paths
const DATA_DIR = path.join(process.cwd(), "data");
const STORIES_FILE = path.join(DATA_DIR, "stories.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const INTERACTIONS_FILE = path.join(DATA_DIR, "interactions.json");

// Ensure data directory exists
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

// Generic file operations
const readJsonFile = <T>(filePath: string, defaultValue: T): T => {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
};

const writeJsonFile = <T>(filePath: string, data: T): void => {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
};

// Story operations
export const loadStories = (): Story[] => {
  const defaultStories: Story[] = [
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
      commentCount: 23,
      image:
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
      commentCount: 18,
      image:
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
      commentCount: 12,
      image:
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
      commentCount: 8,
      image:
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
      commentCount: 15,
      image:
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
      commentCount: 31,
      image:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    },
  ];

  return readJsonFile(STORIES_FILE, defaultStories);
};

export const saveStories = (stories: Story[]): void => {
  writeJsonFile(STORIES_FILE, stories);
};

// Comment operations
export const loadComments = (): Comment[] => {
  return readJsonFile(COMMENTS_FILE, []);
};

export const saveComments = (comments: Comment[]): void => {
  writeJsonFile(COMMENTS_FILE, comments);
};

// Interaction operations (likes, ratings)
interface InteractionData {
  likes: { [storyId: string]: { [userId: string]: boolean } };
  ratings: { [storyId: string]: { [userId: string]: number } };
}

export const loadInteractions = (): InteractionData => {
  return readJsonFile(INTERACTIONS_FILE, { likes: {}, ratings: {} });
};

export const saveInteractions = (interactions: InteractionData): void => {
  writeJsonFile(INTERACTIONS_FILE, interactions);
};

// Migration utilities for future MongoDB implementation
export const exportDataForMigration = () => {
  return {
    stories: loadStories(),
    comments: loadComments(),
    interactions: loadInteractions(),
    exportedAt: new Date().toISOString(),
  };
};

// Initialize data directory on module load
ensureDataDir();
