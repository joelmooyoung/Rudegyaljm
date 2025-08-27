export default async function handler(req, res) {
  console.log(`[IMAGE UPLOAD TEST] ${req.method} /api/test-image-upload`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json({
        success: true,
        message: "Image upload test endpoint is working",
        endpoints: {
          upload: "/api/upload-image.js",
          test: "/api/test-image-upload"
        },
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === "POST") {
      // Test with a small base64 image
      const testImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      
      console.log("[IMAGE UPLOAD TEST] Testing with sample image data");

      const response = await fetch(`${req.headers.host ? 'https://' + req.headers.host : 'http://localhost:3000'}/api/upload-image.js`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: testImageData,
          filename: "test-image.png",
          maxWidth: 600,
          quality: 0.6,
        }),
      });

      const responseText = await response.text();
      console.log("[IMAGE UPLOAD TEST] Upload API response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        return res.status(500).json({
          success: false,
          message: "Upload API returned invalid JSON",
          responseText: responseText,
          parseError: parseError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: "Image upload API test completed",
        uploadApiStatus: response.status,
        uploadApiResponse: result,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });

  } catch (error) {
    console.error(`[IMAGE UPLOAD TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
      stack: error.stack
    });
  }
}
