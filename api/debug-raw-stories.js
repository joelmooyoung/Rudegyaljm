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

    // Get first few stories with all fields
    const stories = await Story.find({}).limit(3).lean();

    const response = {
      totalStories: await Story.countDocuments(),
      rawStories: stories.map((story) => ({
        storyId: story.storyId,
        title: story.title,
        image: story.image,
        excerpt: story.excerpt,
        accessLevel: story.accessLevel,
        hasImageField: story.hasOwnProperty("image"),
        imageType: typeof story.image,
        allFields: Object.keys(story).sort(),
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
