import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";

// Vercel-specific configuration
export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
    responseLimit: false, // Allow large responses
    maxDuration: 30, // Maximum function duration (seconds) - use max available
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
    // Check if running on Vercel (production) or local development
    const isVercel = process.env.VERCEL || process.env.NODE_ENV === "production";
    console.log(`[AUDIO UPLOAD API] Environment: ${isVercel ? 'Vercel' : 'Local'}`);
    
    // Vercel has much stricter limits, so we need to be more conservative
    const maxFileSize = isVercel ? 4 * 1024 * 1024 : 50 * 1024 * 1024; // 4MB for Vercel, 50MB for local
    
    console.log(`[AUDIO UPLOAD API] Max file size: ${maxFileSize / 1024 / 1024}MB`);
    console.log("[AUDIO UPLOAD API] Creating formidable form parser");

    // Parse the multipart form data with stricter limits for Vercel
    const form = formidable({
      maxFileSize: maxFileSize,
      allowEmptyFiles: false,
      maxFiles: 1, // Only allow one file
      maxFields: 5, // Limit number of form fields
      maxFieldsSize: 1024, // Limit size of form fields
      filter: function ({ mimetype }) {
        console.log(`[AUDIO UPLOAD API] Checking file type: ${mimetype}`);
        // Accept audio files
        return mimetype && mimetype.startsWith("audio/");
      },
    });

    console.log("[AUDIO UPLOAD API] Parsing form data");
    const [fields, files] = await form.parse(req);

    console.log("[AUDIO UPLOAD API] Files parsed:", Object.keys(files));
    console.log("[AUDIO UPLOAD API] Fields parsed:", Object.keys(fields));

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile) {
      console.error("[AUDIO UPLOAD API] No audio file found in upload");
      return res.status(400).json({
        success: false,
        message: "No audio file provided",
      });
    }

    // Additional file size check
    if (audioFile.size > maxFileSize) {
      console.error(`[AUDIO UPLOAD API] File too large: ${audioFile.size} bytes (max: ${maxFileSize})`);
      return res.status(400).json({
        success: false,
        message: `Audio file too large. Maximum size is ${Math.floor(maxFileSize / 1024 / 1024)}MB for production uploads.`,
        maxSize: maxFileSize,
        actualSize: audioFile.size,
      });
    }

    console.log(
      `[AUDIO UPLOAD API] Processing audio: ${audioFile.originalFilename} (${audioFile.size} bytes)`,
    );

    let audioUrl;

    if (isVercel) {
      // Vercel/Production: Convert audio to base64 data URL (no filesystem)
      console.log(
        "[AUDIO UPLOAD API] Running on Vercel - using base64 encoding",
      );

      try {
        const audioBuffer = await fs.readFile(audioFile.filepath);
        const base64Audio = audioBuffer.toString("base64");
        const mimeType = audioFile.mimetype || "audio/mpeg";

        audioUrl = `data:${mimeType};base64,${base64Audio}`;
        console.log(
          `[AUDIO UPLOAD API] ✅ Audio encoded as base64 (${audioBuffer.length} bytes)`,
        );

        // Verify base64 size isn't too large for database/response
        const base64Size = base64Audio.length;
        const base64SizeMB = base64Size / 1024 / 1024;
        console.log(`[AUDIO UPLOAD API] Base64 size: ${base64SizeMB.toFixed(2)}MB`);

        if (base64Size > 10 * 1024 * 1024) { // 10MB base64 limit
          console.error(`[AUDIO UPLOAD API] Base64 too large: ${base64SizeMB.toFixed(2)}MB`);
          return res.status(400).json({
            success: false,
            message: `Audio file creates base64 data that is too large (${base64SizeMB.toFixed(2)}MB). Please use a smaller file.`,
            base64Size: base64Size,
          });
        }
      } catch (base64Error) {
        console.error("[AUDIO UPLOAD API] Base64 conversion failed:", base64Error);
        return res.status(500).json({
          success: false,
          message: "Failed to process audio file",
          error: base64Error.message,
        });
      }
    } else {
      // Development: Save to filesystem
      console.log("[AUDIO UPLOAD API] Running locally - saving to filesystem");

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "audio");
      console.log(
        `[AUDIO UPLOAD API] Checking uploads directory: ${uploadsDir}`,
      );

      try {
        await fs.access(uploadsDir);
        console.log("[AUDIO UPLOAD API] Uploads directory exists");
      } catch {
        console.log("[AUDIO UPLOAD API] Creating uploads directory");
        await fs.mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = audioFile.originalFilename || "audio";
      const extension = path.extname(originalName);
      const filename = `story-audio-${timestamp}${extension}`;
      const finalPath = path.join(uploadsDir, filename);

      console.log(
        `[AUDIO UPLOAD API] Copying file from ${audioFile.filepath} to ${finalPath}`,
      );

      // Copy file to final destination
      await fs.copyFile(audioFile.filepath, finalPath);

      // Verify file was copied successfully
      const stats = await fs.stat(finalPath);
      console.log(
        `[AUDIO UPLOAD API] File copied successfully, size: ${stats.size} bytes`,
      );

      audioUrl = `/uploads/audio/${filename}`;
    }

    // Clean up temp file
    try {
      await fs.unlink(audioFile.filepath);
      console.log("[AUDIO UPLOAD API] Temp file cleaned up");
    } catch (error) {
      console.warn("[AUDIO UPLOAD API] Could not clean up temp file:", error);
    }

    console.log(
      `[AUDIO UPLOAD API] ✅ Audio uploaded successfully: ${audioUrl?.substring(0, 100)}...`,
    );

    return res.status(200).json({
      success: true,
      message: "Audio uploaded successfully",
      audioUrl: audioUrl,
      originalName: audioFile.originalFilename,
      size: audioFile.size,
      mimeType: audioFile.mimetype,
      environment: isVercel ? 'production' : 'development',
    });
  } catch (error) {
    console.error("[AUDIO UPLOAD API] ❌ Error:", error);
    
    // Provide more specific error messages for debugging
    let userMessage = "Failed to upload audio file";
    if (error.message?.includes("maxFileSize")) {
      userMessage = "Audio file is too large. Please use a smaller file.";
    } else if (error.message?.includes("timeout")) {
      userMessage = "Upload timeout. Please try with a smaller file.";
    } else if (error.message?.includes("LIMIT_FILE_SIZE")) {
      userMessage = "File size limit exceeded. Maximum size is 4MB for production.";
    }
    
    return res.status(500).json({
      success: false,
      message: userMessage,
      error: error.message,
      environment: process.env.VERCEL ? 'production' : 'development',
    });
  }
}
