// Vercel-compatible audio upload using JSON base64 data (like image upload)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb", // Allow large base64 data
    },
  },
};

export default async function handler(req, res) {
  console.log(`[AUDIO UPLOAD API] ${req.method} ${req.url}`);

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
      message: "Method not allowed",
    });
  }

  try {
    const { audioData, filename, mimeType, size } = req.body;

    if (!audioData || !filename) {
      return res.status(400).json({
        success: false,
        message: "Missing audio data or filename",
      });
    }

    // Validate the audio data is base64
    if (!audioData.startsWith("data:audio/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid audio data format",
      });
    }

    console.log(
      `[AUDIO UPLOAD API] Processing audio: ${filename} (${size} bytes)`,
    );

    // Check if running on Vercel (production) or local development
    const isVercel = process.env.VERCEL || process.env.NODE_ENV === "production";
    console.log(`[AUDIO UPLOAD API] Environment: ${isVercel ? "Vercel" : "Local"}`);

    // File size validation
    const maxSize = isVercel ? 4 * 1024 * 1024 : 50 * 1024 * 1024; // 4MB for Vercel, 50MB for local
    
    if (size > maxSize) {
      console.error(`[AUDIO UPLOAD API] File too large: ${size} bytes (max: ${maxSize})`);
      return res.status(400).json({
        success: false,
        message: `Audio file too large. Maximum size is ${Math.floor(maxSize / 1024 / 1024)}MB for ${isVercel ? 'production' : 'development'} uploads.`,
        maxSize: maxSize,
        actualSize: size,
      });
    }

    // Extract base64 data
    const base64Data = audioData.split(",")[1];
    if (!base64Data) {
      return res.status(400).json({
        success: false,
        message: "Invalid base64 audio data",
      });
    }

    // Convert base64 to buffer to verify size
    const buffer = Buffer.from(base64Data, "base64");
    const actualSize = buffer.length;

    // Validate buffer size matches reported size
    if (Math.abs(actualSize - size) > 1024) { // Allow 1KB difference for encoding overhead
      console.warn(`[AUDIO UPLOAD API] Size mismatch: reported ${size}, actual ${actualSize}`);
    }

    // Validate file type
    const allowedTypes = ["mpeg", "mp3", "wav", "ogg", "m4a", "aac", "flac"];
    const mimeTypeLower = (mimeType || "").toLowerCase();
    const isValidType = allowedTypes.some(type => 
      mimeTypeLower.includes(type) || audioData.includes(`audio/${type}`)
    );

    if (!isValidType) {
      return res.status(400).json({
        success: false,
        message: "Invalid audio file type. Only MP3, WAV, OGG, M4A, AAC, and FLAC are allowed.",
      });
    }

    let audioUrl;

    if (isVercel) {
      // Vercel/Production: Use the base64 data directly (no filesystem)
      console.log("[AUDIO UPLOAD API] Vercel environment - using base64 data URL");
      
      // Verify base64 size isn't too large for storage/response
      const base64SizeMB = actualSize / 1024 / 1024;
      console.log(`[AUDIO UPLOAD API] Base64 size: ${base64SizeMB.toFixed(2)}MB`);

      if (actualSize > 10 * 1024 * 1024) { // 10MB base64 limit
        console.error(`[AUDIO UPLOAD API] Base64 too large: ${base64SizeMB.toFixed(2)}MB`);
        return res.status(400).json({
          success: false,
          message: `Audio file creates base64 data that is too large (${base64SizeMB.toFixed(2)}MB). Please use a smaller file.`,
          base64Size: actualSize,
        });
      }

      audioUrl = audioData; // Use the complete data URL
      console.log(`[AUDIO UPLOAD API] ✅ Using base64 data URL (${base64SizeMB.toFixed(2)}MB)`);
      
    } else {
      // Development: Save to filesystem
      console.log("[AUDIO UPLOAD API] Local environment - saving to filesystem");
      
      const fs = await import("fs/promises");
      const path = await import("path");
      
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "audio");
      
      try {
        await fs.access(uploadsDir);
        console.log("[AUDIO UPLOAD API] Uploads directory exists");
      } catch {
        console.log("[AUDIO UPLOAD API] Creating uploads directory");
        await fs.mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = path.extname(filename) || '.mp3';
      const uniqueFilename = `story-audio-${timestamp}${extension}`;
      const finalPath = path.join(uploadsDir, uniqueFilename);

      // Write buffer to file
      await fs.writeFile(finalPath, buffer);
      
      // Verify file was written successfully
      const stats = await fs.stat(finalPath);
      console.log(`[AUDIO UPLOAD API] File saved successfully, size: ${stats.size} bytes`);

      audioUrl = `/uploads/audio/${uniqueFilename}`;
    }

    console.log(`[AUDIO UPLOAD API] ✅ Audio processed successfully`);

    return res.status(200).json({
      success: true,
      message: "Audio uploaded successfully",
      audioUrl: audioUrl,
      originalName: filename,
      size: size,
      mimeType: mimeType,
      environment: isVercel ? "production" : "development",
    });
  } catch (error) {
    console.error("[AUDIO UPLOAD API] ❌ Error:", error);

    // Provide more specific error messages
    let userMessage = "Failed to upload audio file";
    if (error.message?.includes("JSON")) {
      userMessage = "Invalid audio data format. Please try again.";
    } else if (error.message?.includes("size")) {
      userMessage = "Audio file is too large. Please use a smaller file.";
    }

    return res.status(500).json({
      success: false,
      message: userMessage,
      error: error.message,
      environment: process.env.VERCEL ? "production" : "development",
    });
  }
}
