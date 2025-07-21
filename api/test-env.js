export default async function handler(req, res) {
  console.log(`[TEST ENV] ${req.method} /api/test-env`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const envCheck = {
      nodeEnv: process.env.NODE_ENV || "NOT SET",
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyLength: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0,
      resendKeyFirst10: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) : "NOT SET",
      fromEmail: process.env.RESEND_FROM_EMAIL || "NOT SET",
      frontendUrl: process.env.FRONTEND_URL || "NOT SET",
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('RESEND')),
    };

    console.log("[TEST ENV] Environment check:", envCheck);

    return res.status(200).json({
      success: true,
      env: envCheck
    });

  } catch (error) {
    console.error("[TEST ENV] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
