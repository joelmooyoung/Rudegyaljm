export default async function handler(req, res) {
  console.log(`[DEBUG EMAIL] ${req.method} /api/debug-email`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  console.log(`[DEBUG EMAIL API] Method: ${req.method}`);

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: `Method not allowed. Got ${req.method}, expected GET`,
    });
  }

  try {
    const debugInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyPrefix: process.env.RESEND_API_KEY
        ? process.env.RESEND_API_KEY.substring(0, 8) + "..."
        : "NOT SET",
      fromEmail: process.env.RESEND_FROM_EMAIL || "NOT SET",
      frontendUrl: process.env.FRONTEND_URL || "NOT SET",
      timestamp: new Date().toISOString(),
    };

    console.log("[DEBUG EMAIL] Configuration check:", debugInfo);

    return res.status(200).json({
      success: true,
      message: "Email configuration debug info",
      debug: debugInfo,
    });
  } catch (error) {
    console.error("[DEBUG EMAIL] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Debug failed",
      error: error.message,
    });
  }
}
