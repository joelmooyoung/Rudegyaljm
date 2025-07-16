// Simple test endpoint that should always work
export default function handler(req, res) {
  console.log("Test endpoint called");

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    message: "Simple test endpoint working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    hasMongoUri: !!process.env.MONGODB_URI,
    vercelRegion: process.env.VERCEL_REGION || "unknown",
  });
}
