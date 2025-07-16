// Simple ping endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({
    message: "pong",
    timestamp: new Date().toISOString(),
    method: req.method,
  });
}
