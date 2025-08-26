export default async function handler(req, res) {
  console.log(`[TEST MIGRATION API] ${req.method} /api/admin/test-migration`);

  // Enable CORS and set content type
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    return res.status(200).json({
      success: true,
      message: "Migration API test successful",
      timestamp: new Date().toISOString(),
      endpoint: "/api/admin/test-migration",
    });
  } catch (error) {
    console.error(`[TEST MIGRATION API] ❌ Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
    });
  }
}
