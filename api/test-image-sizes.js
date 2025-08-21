import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[TEST IMAGE SIZES] ${req.method} /api/test-image-sizes`);

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    
    // Get stories with images to check sizes
    const stories = await Story.find({ image: { $exists: true, $ne: null } }).limit(5);
    
    const imageSizes = stories.map(story => ({
      id: story.storyId,
      title: story.title,
      hasImage: !!story.image,
      imageSize: story.image ? story.image.length : 0,
      imageSizeKB: story.image ? Math.round(story.image.length / 1024) : 0,
      imageType: story.image ? (story.image.startsWith('data:image/') ? story.image.split(';')[0] : 'unknown') : null
    }));

    const totalImageSize = imageSizes.reduce((sum, story) => sum + story.imageSize, 0);
    const avgImageSize = totalImageSize / imageSizes.length;

    console.log("[TEST IMAGE SIZES] Image analysis:", {
      storiesWithImages: imageSizes.length,
      totalSizeKB: Math.round(totalImageSize / 1024),
      avgSizeKB: Math.round(avgImageSize / 1024),
      sizes: imageSizes
    });

    return res.json({
      success: true,
      analysis: {
        storiesWithImages: imageSizes.length,
        totalSizeBytes: totalImageSize,
        totalSizeKB: Math.round(totalImageSize / 1024),
        avgSizeBytes: Math.round(avgImageSize),
        avgSizeKB: Math.round(avgImageSize / 1024)
      },
      stories: imageSizes
    });

  } catch (error) {
    console.error("[TEST IMAGE SIZES] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to test image sizes",
      error: error.message
    });
  }
}
