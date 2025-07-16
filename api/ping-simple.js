// Simple ping endpoint with no imports - should always work
export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const hasMongoUri = !!process.env.MONGODB_URI;
  const nodeEnv = process.env.NODE_ENV || "development";

  return res.status(200).json({
    success: true,
    message: "Simple ping endpoint working!",
    timestamp: new Date().toISOString(),
    environment: nodeEnv,
    database: {
      configured: hasMongoUri,
      status: hasMongoUri ? "MongoDB URI available" : "No MongoDB URI",
    },
    vercel: {
      region: process.env.VERCEL_REGION || "unknown",
      deployment: process.env.VERCEL_URL || "local",
    },
  });
}
