// Story management API - handles all story CRUD operations
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

export default async function handler(req, res) {
  console.log(`[STORIES API] ${req.method} request to /api/stories`);
  console.log(`[STORIES API] Query params:`, req.query);
  console.log(`[STORIES API] Body:`, req.body);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    console.log(`[STORIES API] OPTIONS request handled`);
    return res.status(200).end();
  }

  try {
    const { method, query, body } = req;
    const storyId = query.id;

    switch (method) {
      case "GET":
        console.log(`[STORIES API] GET request, storyId: ${storyId}`);
        if (storyId) {
          // Get single story
          const story = stories.find((s) => s.id === storyId);
          if (!story) {
            console.log(`[STORIES API] Story not found: ${storyId}`);
            return res.status(404).json({ message: "Story not found" });
          }
          console.log(`[STORIES API] Returning single story: ${story.title}`);
          return res.json(story);
        } else {
          // Get all stories
          console.log(`[STORIES API] Returning ${stories.length} stories`);
          return res.json(stories);
        }

      case "POST":
        console.log(`[STORIES API] Creating new story with data:`, body);

        if (!body || !body.title) {
          console.log(`[STORIES API] Invalid story data - missing title`);
          return res.status(400).json({ message: "Story title is required" });
        }

        const newStory = {
          id: Date.now().toString(),
          title: body.title || "Untitled",
          author: body.author || "Unknown Author",
          excerpt: body.excerpt || "",
          content: body.content || "",
          tags: Array.isArray(body.tags) ? body.tags : [],
          category: body.category || "Romance",
          accessLevel: body.accessLevel || "free",
          isPublished: body.isPublished || false,
          rating: body.rating || 0,
          ratingCount: body.ratingCount || 0,
          viewCount: body.viewCount || 0,
          commentCount: body.commentCount || 0,
          image: body.image || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        stories.push(newStory);
        console.log(
          `[STORIES API] ✅ Created new story with ID: ${newStory.id}`,
        );
        return res.status(201).json(newStory);

      case "PUT":
        console.log(`[STORIES API] Updating story ${storyId} with data:`, body);

        if (!storyId) {
          console.log(`[STORIES API] PUT request missing story ID`);
          return res.status(400).json({ message: "Story ID is required" });
        }

        const storyIndex = stories.findIndex((s) => s.id === storyId);
        if (storyIndex === -1) {
          console.log(`[STORIES API] Story not found for update: ${storyId}`);
          return res.status(404).json({ message: "Story not found" });
        }

        // Update the story
        stories[storyIndex] = {
          ...stories[storyIndex],
          ...body,
          id: storyId, // Ensure ID doesn't change
          updatedAt: new Date(),
        };

        console.log(`[STORIES API] ✅ Updated story ${storyId}`);
        return res.json(stories[storyIndex]);

      case "DELETE":
        console.log(`[STORIES API] Deleting story: ${storyId}`);

        if (!storyId) {
          return res.status(400).json({ message: "Story ID is required" });
        }

        const deleteIndex = stories.findIndex((s) => s.id === storyId);
        if (deleteIndex === -1) {
          console.log(`[STORIES API] Story not found for deletion: ${storyId}`);
          return res.status(404).json({ message: "Story not found" });
        }

        stories.splice(deleteIndex, 1);
        console.log(`[STORIES API] ✅ Deleted story ${storyId}`);
        return res.json({ message: "Story deleted successfully" });

      default:
        console.log(`[STORIES API] Method not allowed: ${method}`);
        return res
          .status(405)
          .json({ message: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error(`[STORIES API] ❌ Error:`, error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
