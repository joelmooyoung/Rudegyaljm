export default async function handler(req, res) {
  console.log(`[TEST CONNECTIVITY] ${req.method} /api/test-connectivity`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    return res.status(200).json({
      success: true,
      message: "API connectivity working",
      method: req.method,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown"
    });
  } catch (error) {
    console.error("[TEST CONNECTIVITY] Error:", error);
    return res.status(500).json({
      success: false,
      message: "API connectivity failed",
      error: error.message
    });
  }
}
