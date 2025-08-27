// Ultra-simple test endpoint to debug response handling issues
export default async function handler(req, res) {
  console.log(`[SIMPLE RESPONSE TEST] ${req.method} /api/test-simple-response`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Return the simplest possible response
  try {
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[SIMPLE RESPONSE TEST] Error:", error);
    return res.status(500).json({ ok: false });
  }
}
