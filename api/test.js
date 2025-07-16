// Simple test endpoint to verify Vercel functions work
export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  res.json({
    message: "Vercel API functions are working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
  });
}
