import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDatabase();

    // Get first few stories to check structure
    const stories = await Story.find({}).limit(3).lean();

    const response = {
      totalStories: await Story.countDocuments(),
      sampleStories: stories.map((story) => ({
        storyId: story.storyId,
        title: story.title,
        hasImage: !!story.image,
        hasExcerpt: !!story.excerpt,
        hasAccessLevel: !!story.accessLevel,
        imageData: story.image ? story.image.substring(0, 50) + "..." : null,
        excerpt: story.excerpt,
        accessLevel: story.accessLevel,
        allFields: Object.keys(story),
      })),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Debug error:", error);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
}
