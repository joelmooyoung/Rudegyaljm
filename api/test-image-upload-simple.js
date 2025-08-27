// Simple image upload test endpoint
export default function handler(req, res) {
  console.log(`[TEST IMAGE UPLOAD] ${req.method} /api/test-image-upload-simple`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    // Test endpoint availability
    console.log("[TEST IMAGE UPLOAD] Testing endpoint availability");
    return res.status(200).json({
      success: true,
      message: "Image upload test endpoint is working",
      endpoint: "/api/upload-image",
      timestamp: new Date().toISOString(),
      methods: ["POST"],
    });
  }

  if (req.method === "POST") {
    // Test actual upload functionality
    console.log("[TEST IMAGE UPLOAD] Testing upload functionality");
    
    try {
      const { imageData, filename } = req.body || {};
      
      if (!imageData || !filename) {
        return res.status(400).json({
          success: false,
          error: "Missing imageData or filename in test request",
          received: {
            hasImageData: !!imageData,
            hasFilename: !!filename,
          }
        });
      }

      // Validate base64 format
      if (!imageData.startsWith("data:image/")) {
        return res.status(400).json({
          success: false,
          error: "Invalid image data format in test request",
          format: imageData.substring(0, 50) + "..."
        });
      }

      console.log("[TEST IMAGE UPLOAD] ✅ Test upload validation passed");
      
      return res.status(200).json({
        success: true,
        message: "Image upload test successful",
        uploadApiStatus: "Available",
        receivedData: {
          filename: filename,
          imageDataLength: imageData.length,
          imageDataPrefix: imageData.substring(0, 50),
        },
        nextStep: "Use /api/upload-image for actual uploads",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[TEST IMAGE UPLOAD] ❌ Test error:", error);
      return res.status(500).json({
        success: false,
        error: "Test upload failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: "Method not allowed",
    allowedMethods: ["GET", "POST"],
  });
}
