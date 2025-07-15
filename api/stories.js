// Vercel serverless function for stories
const stories = [
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
  {
    id: "4",
    title: "Dragons of Eldoria",
    author: "Fantasy Weaver",
    excerpt:
      "In a realm where magic and desire intertwine, a princess discovers that the greatest treasures aren't gold, but the fire that burns within.",
    content: "Fantasy adventure content...",
    tags: ["Fantasy", "Dragons", "Magic"],
    category: "Fantasy",
    accessLevel: "premium",
    isPublished: false,
    rating: 4.7,
    ratingCount: 234,
    viewCount: 3456,
    commentCount: 67,
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "5",
    title: "The Comedy Club Catastrophe",
    author: "Laughing Lover",
    excerpt:
      "When stand-up comedy meets romantic chaos, the only thing funnier than the jokes are the disasters that follow. A lighthearted romp through love and laughter.",
    content: "Comedy content...",
    tags: ["Comedy", "Romance", "Laughter"],
    category: "Comedy",
    accessLevel: "free",
    isPublished: true,
    rating: 4.2,
    ratingCount: 189,
    viewCount: 5678,
    commentCount: 92,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "6",
    title: "Whispers in the Library",
    author: "Literary Seductress",
    excerpt:
      "Between dusty books and quiet corners, she found more than knowledge. A tale of intellectual seduction and the power of whispered words.",
    content: "Premium library romance...",
    tags: ["Library", "Intellectual", "Whispers"],
    category: "Seductive",
    accessLevel: "premium",
    isPublished: true,
    rating: 4.9,
    ratingCount: 445,
    viewCount: 7890,
    commentCount: 78,
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20"),
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
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

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log(`[DEBUG] Total stories in database: ${stories.length}`);
    console.log(
      "[DEBUG] Stories:",
      stories.map((s) => ({
        id: s.id,
        title: s.title,
        isPublished: s.isPublished,
        accessLevel: s.accessLevel,
      })),
    );
    console.log(`[DEBUG] Returning ${stories.length} stories`);

    res.json(stories);
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
