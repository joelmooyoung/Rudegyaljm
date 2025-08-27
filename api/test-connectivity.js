// Simple connectivity test endpoint
export default function handler(req, res) {
  console.log("🔍 [TEST CONNECTIVITY] Request received:", {
    method: req.method,
    url: req.url,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });

  try {
    // Return simple JSON response
    const response = {
      success: true,
      message: "Connectivity test successful",
      timestamp: new Date().toISOString(),
      method: req.method,
      status: "OK",
    };

    console.log("🔍 [TEST CONNECTIVITY] Sending response:", response);

    res.status(200).json(response);
  } catch (error) {
    console.error("🔍 [TEST CONNECTIVITY] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
