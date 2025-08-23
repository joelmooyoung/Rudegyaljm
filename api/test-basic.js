// Ultra-simple test endpoint to verify API routing
export default async function handler(req, res) {
  console.log(`[TEST BASIC] ${req.method} /api/test-basic`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    const result = {
      success: true,
      message: "Basic test working",
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    };

    console.log(`[TEST BASIC] Returning:`, result);
    return res.status(200).json(result);

  } catch (error) {
    console.error(`[TEST BASIC] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
