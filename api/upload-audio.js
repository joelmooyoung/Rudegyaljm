import formidable from "formidable";
import { promises as fs } from "fs";
import path from "path";

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
    console.log("[AUDIO UPLOAD API] Creating formidable form parser");

    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      allowEmptyFiles: false,
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

    console.log(
      `[AUDIO UPLOAD API] Processing audio: ${audioFile.originalFilename} (${audioFile.size} bytes)`,
    );

    // Check if running on Vercel (production) or local development
    const isVercel = process.env.VERCEL || process.env.NODE_ENV === "production";

    let audioUrl;

    if (isVercel) {
      // Vercel/Production: Convert audio to base64 data URL (like images)
      console.log("[AUDIO UPLOAD API] Running on Vercel - using base64 encoding");

      const audioBuffer = await fs.readFile(audioFile.filepath);
      const base64Audio = audioBuffer.toString('base64');
      const mimeType = audioFile.mimetype || 'audio/mpeg';

      audioUrl = `data:${mimeType};base64,${base64Audio}`;
      console.log(`[AUDIO UPLOAD API] ✅ Audio encoded as base64 (${audioBuffer.length} bytes)`);

    } else {
      // Development: Save to filesystem
      console.log("[AUDIO UPLOAD API] Running locally - saving to filesystem");

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "audio");
      console.log(`[AUDIO UPLOAD API] Checking uploads directory: ${uploadsDir}`);

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
      `[AUDIO UPLOAD API] ✅ Audio uploaded successfully: ${audioUrl}`,
    );

    return res.status(200).json({
      success: true,
      message: "Audio uploaded successfully",
      audioUrl: audioUrl,
      originalName: audioFile.originalFilename,
      size: audioFile.size,
      mimeType: audioFile.mimetype,
    });
  } catch (error) {
    console.error("[AUDIO UPLOAD API] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload audio file",
      error: error.message,
    });
  }
}
