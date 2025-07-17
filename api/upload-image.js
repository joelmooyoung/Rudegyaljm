export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
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
    const { imageData, filename } = req.body;

    if (!imageData || !filename) {
      return res.status(400).json({
        error: "Missing image data or filename",
      });
    }

    // Validate the image data is base64
    if (!imageData.startsWith("data:image/")) {
      return res.status(400).json({
        error: "Invalid image data format",
      });
    }

    // Extract base64 data
    const base64Data = imageData.split(",")[1];
    if (!base64Data) {
      return res.status(400).json({
        error: "Invalid base64 image data",
      });
    }

    // Convert base64 to buffer to check size
    const buffer = Buffer.from(base64Data, "base64");

    // Validate file size (5MB limit)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: "Image too large. Maximum size is 5MB.",
      });
    }

    // Get file extension from data URL
    const mimeMatch = imageData.match(/data:image\/([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : "jpeg";

    // Validate file type
    const allowedTypes = ["jpeg", "jpg", "png", "gif", "webp"];
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({
        error: "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.",
      });
    }

    // Generate unique filename for reference
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = mimeType === "jpeg" ? "jpg" : mimeType;
    const newFilename = `story-${timestamp}-${randomString}.${fileExtension}`;

    // In serverless environment, we return the base64 data URL directly
    // This will be stored in the database instead of as a file
    const imageUrl = imageData; // Return the base64 data URL

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      filename: newFilename,
      size: buffer.length,
      message: "Image processed successfully (stored as base64)",
      isBase64: true,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      error: "Failed to process image",
      message: error.message,
    });
  }
}
