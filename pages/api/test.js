// Test endpoint in standard Vercel pages/api structure
export default function handler(req, res) {
  res.status(200).json({
    message: "Test API working!",
    time: new Date().toISOString(),
    method: req.method,
  });
}
