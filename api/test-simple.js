export default async function handler(req, res) {
  console.log(`[SIMPLE TEST] API endpoint working`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    return res.status(200).json({
      success: true,
      message: "API endpoint is working",
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV || "not set",
        MONGODB_URI: !!process.env.MONGODB_URI,
      },
    });
  } catch (error) {
    console.error(`[SIMPLE TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Error in API endpoint",
      error: error.message,
    });
  }
}
