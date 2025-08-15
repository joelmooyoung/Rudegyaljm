export default async function handler(req, res) {
  console.log(`[TEST RESET URL] ${req.method} /api/test-reset-url`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Generate a test reset URL like the forgot password would
    const testToken = "abc123456789test";
    const baseUrl =
      process.env.FRONTEND_URL ||
      "https://828ad77a3e9d40c7be6deab3e340d51f-4bd5d56465ea4c69a7b89487f.fly.dev";
    const resetUrl = `${baseUrl}/?reset-password=true&token=${testToken}`;

    return res.status(200).json({
      success: true,
      message: "Test reset URL generated",
      testResetUrl: resetUrl,
      urlBreakdown: {
        baseUrl: baseUrl,
        token: testToken,
        fullUrl: resetUrl,
      },
      instructions:
        "Click this URL to test if it takes you to the reset password form",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TEST RESET URL] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate test URL",
      error: error.message,
    });
  }
}
