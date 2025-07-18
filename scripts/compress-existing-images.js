import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

// Simple image compression for base64 images
function compressBase64Image(base64Data, maxWidth = 600, quality = 0.6) {
  return new Promise((resolve, reject) => {
    try {
      // In a Node.js environment, we would need a library like Sharp or Jimp
      // For now, we'll implement a basic size reduction by estimating compression

      const buffer = Buffer.from(base64Data.split(",")[1], "base64");
      const originalSize = buffer.length;

      // If image is already small (under 150KB), keep as-is
      if (originalSize <= 150 * 1024) {
        console.log(
          `Image already optimized (${(originalSize / 1024).toFixed(1)}KB)`,
        );
        resolve(base64Data);
        return;
      }

      // For demonstration, we'll reduce quality by re-encoding with lower quality
      // In a real implementation, you'd use Sharp or similar:
      // const sharp = require('sharp');
      // const compressedBuffer = await sharp(buffer).jpeg({ quality: 60 }).resize(600).toBuffer();

      // For now, we'll just simulate compression by truncating excess data
      // This is a placeholder - in production you'd want actual image processing
      const targetSize = Math.min(originalSize * 0.5, 200 * 1024); // Target 50% reduction or 200KB max
      const reductionRatio = targetSize / originalSize;

      if (reductionRatio >= 1) {
        resolve(base64Data);
        return;
      }

      // This is a simplified compression simulation
      // In reality, you'd use proper image compression libraries
      console.log(
        `Simulating compression: ${(originalSize / 1024).toFixed(1)}KB → ${(targetSize / 1024).toFixed(1)}KB`,
      );
      resolve(base64Data); // Return original for now
    } catch (error) {
      reject(error);
    }
  });
}

async function compressExistingImages() {
  console.log("🖼️  Starting image compression for existing stories...");

  try {
    // Connect to database
    const dbConnection = await connectToDatabase();

    if (!dbConnection.isConnected) {
      console.error("❌ Could not connect to database");
      return;
    }

    // Find all stories with images
    const storiesWithImages = await Story.find({
      image: { $exists: true, $ne: null, $ne: "" },
    });

    console.log(`📊 Found ${storiesWithImages.length} stories with images`);

    let compressedCount = 0;
    let totalSavings = 0;

    for (const story of storiesWithImages) {
      try {
        if (!story.image || !story.image.startsWith("data:image/")) {
          console.log(
            `⏭️  Skipping story "${story.title}" - not a base64 image`,
          );
          continue;
        }

        console.log(`🔄 Processing story: "${story.title}"`);

        const originalSize = Buffer.from(
          story.image.split(",")[1],
          "base64",
        ).length;
        console.log(`   Original size: ${(originalSize / 1024).toFixed(1)}KB`);

        // Compress the image
        const compressedImage = await compressBase64Image(
          story.image,
          600,
          0.6,
        );
        const compressedSize = Buffer.from(
          compressedImage.split(",")[1],
          "base64",
        ).length;

        const savings = originalSize - compressedSize;

        if (savings > 1024) {
          // Only update if we save more than 1KB
          // Update the story with compressed image
          await Story.findOneAndUpdate(
            { storyId: story.storyId },
            { image: compressedImage },
            { new: true },
          );

          compressedCount++;
          totalSavings += savings;

          console.log(
            `   ✅ Compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (saved ${(savings / 1024).toFixed(1)}KB)`,
          );
        } else {
          console.log(`   ⏭️  No significant compression needed`);
        }
      } catch (error) {
        console.error(
          `   ❌ Error processing story "${story.title}":`,
          error.message,
        );
      }
    }

    console.log(`\n📈 Compression complete!`);
    console.log(`   Stories processed: ${storiesWithImages.length}`);
    console.log(`   Stories compressed: ${compressedCount}`);
    console.log(
      `   Total space saved: ${(totalSavings / 1024 / 1024).toFixed(2)}MB`,
    );

    if (compressedCount === 0) {
      console.log(
        `\n💡 Note: To enable actual image compression, install Sharp or Jimp:`,
      );
      console.log(`   npm install sharp`);
      console.log(
        `   Then uncomment the Sharp compression code in this script.`,
      );
    }
  } catch (error) {
    console.error("❌ Error compressing images:", error);
  }
}

// Run the compression if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  compressExistingImages()
    .then(() => {
      console.log("🎉 Image compression script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { compressExistingImages };
