import formidable from 'formidable';
import { createReadStream, promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log(`[AUDIO UPLOAD API] ${req.method} /api/upload-audio`);

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
      message: "Method not allowed"
    });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      allowEmptyFiles: false,
      filter: function ({ mimetype }) {
        // Accept audio files
        return mimetype && mimetype.startsWith('audio/');
      }
    });

    const [fields, files] = await form.parse(req);
    
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    
    if (!audioFile) {
      return res.status(400).json({
        success: false,
        message: "No audio file provided"
      });
    }

    console.log(`[AUDIO UPLOAD API] Processing audio: ${audioFile.originalFilename} (${audioFile.size} bytes)`);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = audioFile.originalFilename || 'audio';
    const extension = path.extname(originalName);
    const filename = `story-audio-${timestamp}${extension}`;
    const finalPath = path.join(uploadsDir, filename);

    // Copy file to final destination
    await fs.copyFile(audioFile.filepath, finalPath);
    
    // Clean up temp file
    try {
      await fs.unlink(audioFile.filepath);
    } catch (error) {
      console.warn("Could not clean up temp file:", error);
    }

    const audioUrl = `/uploads/audio/${filename}`;
    
    console.log(`[AUDIO UPLOAD API] ✅ Audio uploaded successfully: ${audioUrl}`);

    return res.status(200).json({
      success: true,
      message: "Audio uploaded successfully",
      audioUrl: audioUrl,
      originalName: audioFile.originalFilename,
      size: audioFile.size,
      mimeType: audioFile.mimetype
    });

  } catch (error) {
    console.error("[AUDIO UPLOAD API] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload audio file",
      error: error.message
    });
  }
}
