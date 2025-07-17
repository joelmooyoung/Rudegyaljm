import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDatabase();

    // Sample images for different categories
    const categoryImages = {
      relationships:
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop",
      workplace:
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=400&fit=crop",
      family:
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=400&fit=crop",
      friendship:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop",
      personal:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
      school:
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop",
      adventure:
        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop",
      default:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop",
    };

    // Get all stories without images
    const storiesWithoutImages = await Story.find({
      $or: [{ image: { $exists: false } }, { image: null }, { image: "" }],
    });

    const updates = [];

    for (const story of storiesWithoutImages) {
      const imageUrl = categoryImages[story.category] || categoryImages.default;
      const excerpt = story.content.substring(0, 150) + "...";

      const updateResult = await Story.findOneAndUpdate(
        { storyId: story.storyId },
        {
          $set: {
            image: imageUrl,
            excerpt: excerpt,
            accessLevel: "free",
          },
        },
        { new: true },
      );

      updates.push({
        storyId: story.storyId,
        title: story.title,
        category: story.category,
        imageAdded: !!updateResult.image,
        excerptAdded: !!updateResult.excerpt,
        accessLevelSet: updateResult.accessLevel,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${updates.length} stories with images and excerpts`,
      updates: updates,
    });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
}
