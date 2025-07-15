// Story management API - both reading and writing
let stories = [
  {
    id: "1",
    title: "Midnight Desires",
    author: "Seductive Sage",
    excerpt:
      "In the velvet darkness of midnight, she discovered desires she never knew existed. A tale of passion that ignites the soul and awakens the deepest cravings of the heart.",
    content: "Full story content would be here...",
    tags: ["Passionate", "Romance", "Midnight"],
    category: "Romance",
    accessLevel: "free",
    isPublished: true,
    rating: 4.8,
    ratingCount: 1247,
    viewCount: 15420,
    commentCount: 89,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&q=80",
  },
  {
    id: "2",
    title: "The Executive's Secret",
    author: "Corporate Temptress",
    excerpt:
      "Behind the polished boardroom facade lies a world of forbidden desires. When power meets passion, boundaries dissolve into pure, intoxicating pleasure.",
    content: "Premium content for subscribers...",
    tags: ["Power", "Forbidden", "Executive"],
    category: "Passionate",
    accessLevel: "premium",
    isPublished: true,
    rating: 4.9,
    ratingCount: 892,
    viewCount: 8934,
    commentCount: 156,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  },
  {
    id: "3",
    title: "Summer Heat",
    author: "Tropical Muse",
    excerpt:
      "Under the blazing sun, two souls collided in a symphony of sweat, desire, and uncontrollable attraction. A summer that changed everything.",
    content: "Free story content...",
    tags: ["Summer", "Heat", "Attraction"],
    category: "Romance",
    accessLevel: "free",
    isPublished: true,
    rating: 4.6,
    ratingCount: 567,
    viewCount: 12100,
    commentCount: 43,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  },
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case "GET":
        if (id) {
          // Get single story
          const story = stories.find((s) => s.id === id);
          if (!story) {
            return res.status(404).json({ message: "Story not found" });
          }
          res.json(story);
        } else {
          // Get all stories
          console.log(`[DEBUG] Returning ${stories.length} stories`);
          res.json(stories);
        }
        break;

      case "POST":
        // Create new story
        console.log("[STORY CREATE] Request body:", req.body);
        const newStory = {
          id: Date.now().toString(),
          ...req.body,
          rating: req.body.rating || 0,
          ratingCount: req.body.ratingCount || 0,
          viewCount: req.body.viewCount || 0,
          commentCount: req.body.commentCount || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        stories.push(newStory);
        console.log("[STORY CREATE] Success! New story ID:", newStory.id);
        res.status(201).json(newStory);
        break;

      case "PUT":
        // Update story
        if (!id) {
          console.log("[STORY UPDATE] Error: No story ID provided");
          return res.status(400).json({ message: "Story ID required" });
        }
        console.log(
          "[STORY UPDATE] Updating story:",
          id,
          "with data:",
          req.body,
        );
        const storyIndex = stories.findIndex((s) => s.id === id);
        if (storyIndex === -1) {
          console.log("[STORY UPDATE] Error: Story not found:", id);
          return res.status(404).json({ message: "Story not found" });
        }
        stories[storyIndex] = {
          ...stories[storyIndex],
          ...req.body,
          updatedAt: new Date(),
        };
        console.log("[STORY UPDATE] Success! Updated story:", id);
        res.json(stories[storyIndex]);
        break;

      case "DELETE":
        // Delete story
        if (!id) {
          return res.status(400).json({ message: "Story ID required" });
        }
        console.log("[STORY DELETE] Deleting story:", id);
        const deleteIndex = stories.findIndex((s) => s.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ message: "Story not found" });
        }
        stories.splice(deleteIndex, 1);
        console.log("[STORY DELETE] Success! Deleted story:", id);
        res.json({ message: "Story deleted successfully" });
        break;

      default:
        res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("[STORY API] Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}
