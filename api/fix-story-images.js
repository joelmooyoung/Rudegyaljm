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

    // Check current stories without images
    const storiesWithoutImages = await Story.find({
      $or: [{ image: { $exists: false } }, { image: null }, { image: "" }],
    });

    console.log(`Found ${storiesWithoutImages.length} stories without images`);

    // Category-specific high-quality images
    const categoryImages = {
      passionate:
        "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&h=400&fit=crop&q=80",
      romance:
        "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop&q=80",
      forbidden:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop&q=80",
      midnight:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&q=80",
      seductive:
        "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&h=400&fit=crop&q=80",
      mystery:
        "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=400&fit=crop&q=80",
      fantasy:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&q=80",
      default:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop&q=80",
    };

    const updates = [];

    for (const story of storiesWithoutImages) {
      // Determine image based on category or tags
      let imageUrl = categoryImages.default;

      const categoryKey = story.category?.toLowerCase() || "";
      const allTags = (story.tags || []).join(" ").toLowerCase();

      if (categoryImages[categoryKey]) {
        imageUrl = categoryImages[categoryKey];
      } else if (allTags.includes("passionate")) {
        imageUrl = categoryImages.passionate;
      } else if (allTags.includes("romance")) {
        imageUrl = categoryImages.romance;
      } else if (allTags.includes("forbidden")) {
        imageUrl = categoryImages.forbidden;
      } else if (allTags.includes("midnight")) {
        imageUrl = categoryImages.midnight;
      } else if (allTags.includes("seductive")) {
        imageUrl = categoryImages.seductive;
      } else if (allTags.includes("mystery")) {
        imageUrl = categoryImages.mystery;
      } else if (allTags.includes("fantasy")) {
        imageUrl = categoryImages.fantasy;
      }

      // Generate proper excerpt if missing
      const excerpt = story.excerpt || story.content.substring(0, 150) + "...";

      const updateResult = await Story.findOneAndUpdate(
        { storyId: story.storyId },
        {
          $set: {
            image: imageUrl,
            excerpt: excerpt,
            accessLevel: story.accessLevel || "free",
          },
        },
        { new: true },
      );

      updates.push({
        storyId: story.storyId,
        title: story.title,
        category: story.category,
        tags: story.tags,
        imageAdded: !!updateResult.image,
        excerptAdded: !!updateResult.excerpt,
        accessLevel: updateResult.accessLevel,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully updated ${updates.length} stories with images and excerpts`,
      storiesUpdated: updates.length,
      updates: updates,
    });
  } catch (error) {
    console.error("Error updating stories:", error);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
}
