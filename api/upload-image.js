import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    const [fields, files] = await form.parse(req);

    if (!files.image || !files.image[0]) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const file = files.image[0];
    const fileExtension = path.extname(file.originalFilename || "");
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      // Delete the uploaded file
      fs.unlinkSync(file.filepath);
      return res.status(400).json({
        error:
          "Invalid file type. Only JPG, PNG, GIF, and WebP files are allowed.",
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const newFilename = `story-${timestamp}-${randomString}${fileExtension}`;
    const newFilePath = path.join(uploadsDir, newFilename);

    // Move file to final location
    fs.renameSync(file.filepath, newFilePath);

    // Return the URL path to the uploaded image
    const imageUrl = `/uploads/${newFilename}`;

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      filename: newFilename,
      size: file.size,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      error: "Failed to upload image",
      message: error.message,
    });
  }
}
