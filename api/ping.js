// Simple ping endpoint to test API connectivity
export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const hasMongoUri = !!process.env.MONGODB_URI;

    return res.status(200).json({
      success: true,
      message: "Hello from Express server!",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      endpoint: "/api/ping",
      database: {
        configured: hasMongoUri,
        status: hasMongoUri
          ? "MongoDB URI available"
          : "No MongoDB URI - fallback mode",
      },
    });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
