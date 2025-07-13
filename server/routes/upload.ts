import { RequestHandler } from "express";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// Helper function to log errors
const logError = (
  error: string,
  req: any,
  severity: "low" | "medium" | "high" | "critical" = "medium",
): void => {
  console.error(
    `[${severity.toUpperCase()}] ${req.method} ${req.originalUrl}: ${error}`,
  );
};

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), "public", "uploads");
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// POST /api/upload/image - Upload an image file
export const uploadImage: RequestHandler = async (req, res) => {
  try {
    // For this demo, we'll handle base64 uploads from the frontend
    // In production, you'd use multer or similar for proper file handling
    const { imageData, fileName } = req.body;

    if (!imageData) {
      return res.status(400).json({ message: "No image data provided" });
    }

    // Generate unique filename
    const fileExtension = fileName?.split(".").pop() || "jpg";
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadsDir, uniqueFileName);

    try {
      // Handle base64 data
      let base64Data = imageData;
      if (imageData.startsWith("data:")) {
        base64Data = imageData.split(",")[1];
      }

      // Write file
      require("fs").writeFileSync(filePath, base64Data, "base64");

      // Return public URL
      const imageUrl = `/uploads/${uniqueFileName}`;

      res.json({
        success: true,
        imageUrl,
        message: "Image uploaded successfully",
      });
    } catch (writeError) {
      console.error("File write error:", writeError);
      return res.status(500).json({
        message: "Failed to save image file",
        error:
          writeError instanceof Error ? writeError.message : "Unknown error",
      });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload image";
    logError(`Image upload error: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/upload/copy-url - Copy image from URL
export const copyImageFromUrl: RequestHandler = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "No image URL provided" });
    }

    // For demo purposes, we'll just return the original URL
    // In production, you'd fetch the image and save it to your server

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real implementation, you would:
    // 1. Fetch the image from the URL
    // 2. Save it to your server
    // 3. Return the new local URL

    res.json({
      success: true,
      imageUrl: imageUrl, // In production, this would be your new local URL
      message: "Image copied successfully",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to copy image";
    logError(`Image copy error: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/upload/test - Test endpoint
export const testUpload: RequestHandler = (req, res) => {
  res.json({
    message: "Upload service is running",
    uploadsDir: uploadsDir,
    timestamp: new Date().toISOString(),
  });
};
