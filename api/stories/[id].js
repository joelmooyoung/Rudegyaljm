// Dynamic story API endpoint for individual story operations
const stories = [
  {
    id: "1",
    title: "Midnight Desires",
    author: "Seductive Sage",
    excerpt: "In the velvet darkness of midnight...",
    content: "Full story content...",
    tags: ["Passionate", "Romance"],
    category: "Romance",
    accessLevel: "free",
    isPublished: true,
    rating: 4.8,
    ratingCount: 1247,
    viewCount: 15420,
    commentCount: 89,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "The Executive's Secret",
    author: "Corporate Temptress",
    excerpt: "Behind the polished boardroom facade...",
    content: "Premium content...",
    tags: ["Power", "Forbidden"],
    category: "Passionate",
    accessLevel: "premium",
    isPublished: true,
    rating: 4.9,
    ratingCount: 892,
    viewCount: 8934,
    commentCount: 156,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`[STORY ${id}] ${req.method} request`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case "GET":
        const story = stories.find((s) => s.id === id);
        if (!story) {
          return res.status(404).json({ message: "Story not found" });
        }
        console.log(`[STORY ${id}] ✅ Retrieved story: ${story.title}`);
        return res.json(story);

      case "PUT":
        console.log(`[STORY ${id}] Updating with:`, req.body);
        const storyIndex = stories.findIndex((s) => s.id === id);
        if (storyIndex === -1) {
          return res.status(404).json({ message: "Story not found" });
        }

        // Update story
        stories[storyIndex] = {
          ...stories[storyIndex],
          ...req.body,
          id, // Ensure ID doesn't change
          updatedAt: new Date(),
        };

        console.log(`[STORY ${id}] ✅ Updated successfully`);
        return res.json(stories[storyIndex]);

      case "DELETE":
        const deleteIndex = stories.findIndex((s) => s.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ message: "Story not found" });
        }

        stories.splice(deleteIndex, 1);
        console.log(`[STORY ${id}] ✅ Deleted successfully`);
        return res.json({ message: "Story deleted successfully" });

      default:
        return res
          .status(405)
          .json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error(`[STORY ${id}] ❌ Error:`, error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
