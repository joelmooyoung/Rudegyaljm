export default async function handler(req, res) {
  console.log(`[MINIMAL TEST] ${req.method} /api/test-minimal`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    console.log("[MINIMAL TEST] Returning simple response");
    
    // Return the simplest possible JSON response
    return res.status(200).json({
      success: true,
      message: "Minimal test successful",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[MINIMAL TEST] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Test failed"
    });
  }
}
