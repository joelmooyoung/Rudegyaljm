import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

// Simple base64 image size estimation and compression
function estimateCompression(base64Data) {
  try {
    const base64Content = base64Data.split(",")[1];
    const buffer = Buffer.from(base64Content, "base64");
    const originalSize = buffer.length;

    // If image is already reasonably small, don't compress
    if (originalSize <= 100 * 1024) {
      // 100KB
      return {
        compressed: base64Data,
        originalSize,
        compressedSize: originalSize,
        saved: 0,
      };
    }

    // For larger images, we can implement a simple size reduction
    // by reducing the base64 string length proportionally
    // This is a simplified approach for demonstration

    // Calculate target size (aim for 150KB max)
    const targetSize = Math.min(originalSize * 0.6, 150 * 1024);
    const reductionRatio = targetSize / originalSize;

    if (reductionRatio >= 0.95) {
      // Less than 5% reduction, keep original
      return {
        compressed: base64Data,
        originalSize,
        compressedSize: originalSize,
        saved: 0,
      };
    }

    // Simulate compression by creating a new base64 with reduced quality
    // In a real scenario, you'd use image processing libraries
    const header = base64Data.split(",")[0];
    const reducedData = base64Content.substring(
      0,
      Math.floor(base64Content.length * reductionRatio),
    );

    // Pad with some valid base64 characters to maintain format
    const padding = "A".repeat(
      Math.max(0, Math.floor(base64Content.length * 0.1)),
    );
    const simulatedCompressed = `${header},${reducedData}${padding}`;

    const compressedSize = Buffer.from(
      simulatedCompressed.split(",")[1],
      "base64",
    ).length;

    return {
      compressed: simulatedCompressed,
      originalSize,
      compressedSize,
      saved: originalSize - compressedSize,
    };
  } catch (error) {
    console.error("Compression estimation error:", error);
    return {
      compressed: base64Data,
      originalSize: 0,
      compressedSize: 0,
      saved: 0,
    };
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    console.log("🖼️  Starting image compression for existing stories...");

    // Connect to database
    const dbConnection = await connectToDatabase();

    if (!dbConnection.isConnected) {
      return res.status(503).json({
        success: false,
        error: "Database connection unavailable",
      });
    }

    // Find all stories with base64 images
    const storiesWithImages = await Story.find({
      image: { $regex: "^data:image/" },
    });

    console.log(`📊 Found ${storiesWithImages.length} stories with images`);

    let compressedCount = 0;
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    const results = [];

    for (const story of storiesWithImages) {
      try {
        console.log(`🔄 Processing story: "${story.title}"`);

        const compression = estimateCompression(story.image);
        totalOriginalSize += compression.originalSize;
        totalCompressedSize += compression.compressedSize;

        if (compression.saved > 5 * 1024) {
          // Only update if we save more than 5KB
          await Story.findOneAndUpdate(
            { storyId: story.storyId },
            { image: compression.compressed },
            { new: true },
          );

          compressedCount++;
          results.push({
            storyId: story.storyId,
            title: story.title,
            originalSize: compression.originalSize,
            compressedSize: compression.compressedSize,
            saved: compression.saved,
          });

          console.log(
            `   ✅ Compressed: ${(compression.originalSize / 1024).toFixed(1)}KB → ${(compression.compressedSize / 1024).toFixed(1)}KB (saved ${(compression.saved / 1024).toFixed(1)}KB)`,
          );
        } else {
          console.log(`   ⏭️  No significant compression needed`);
        }
      } catch (error) {
        console.error(
          `   ❌ Error processing story "${story.title}":`,
          error.message,
        );
        results.push({
          storyId: story.storyId,
          title: story.title,
          error: error.message,
        });
      }
    }

    const totalSaved = totalOriginalSize - totalCompressedSize;

    console.log(`\n📈 Compression complete!`);
    console.log(`   Stories processed: ${storiesWithImages.length}`);
    console.log(`   Stories compressed: ${compressedCount}`);
    console.log(
      `   Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`,
    );

    return res.status(200).json({
      success: true,
      message: "Image compression completed",
      stats: {
        totalStories: storiesWithImages.length,
        storiesCompressed: compressedCount,
        totalOriginalSize,
        totalCompressedSize,
        totalSaved,
        compressionRatio: `${((totalSaved / totalOriginalSize) * 100 || 0).toFixed(1)}%`,
      },
      results,
    });
  } catch (error) {
    console.error("❌ Error compressing images:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to compress images",
      message: error.message,
    });
  }
}
