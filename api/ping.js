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
    return res.status(200).json({
      success: true,
      message: "Hello from Express server!",
      timestamp: new Date().toISOString(),
      environment: "Builder.io",
      endpoint: "/api/ping",
    });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
