// Story management API
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
          res.json(stories);
        }
        break;

      case "POST":
        // Create new story
        console.log("Creating new story:", req.body);
        const newStory = {
          id: Date.now().toString(),
          ...req.body,
          rating: 0,
          ratingCount: 0,
          viewCount: 0,
          commentCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        stories.push(newStory);
        console.log("Story created successfully:", newStory.id);
        res.status(201).json(newStory);
        break;

      case "PUT":
        // Update story
        if (!id) {
          return res.status(400).json({ message: "Story ID required" });
        }
        console.log("Updating story:", id, req.body);
        const storyIndex = stories.findIndex((s) => s.id === id);
        if (storyIndex === -1) {
          return res.status(404).json({ message: "Story not found" });
        }
        stories[storyIndex] = {
          ...stories[storyIndex],
          ...req.body,
          updatedAt: new Date(),
        };
        console.log("Story updated successfully:", id);
        res.json(stories[storyIndex]);
        break;

      case "DELETE":
        // Delete story
        if (!id) {
          return res.status(400).json({ message: "Story ID required" });
        }
        console.log("Deleting story:", id);
        const deleteIndex = stories.findIndex((s) => s.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ message: "Story not found" });
        }
        stories.splice(deleteIndex, 1);
        console.log("Story deleted successfully:", id);
        res.json({ message: "Story deleted successfully" });
        break;

      default:
        res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Story management error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
