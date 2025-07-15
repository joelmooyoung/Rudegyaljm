// Login logs API
const loginLogs = [
  {
    id: "1",
    userId: "admin1",
    email: "admin@nocturne.com",
    ipAddress: "192.168.1.100",
    country: "🇺🇸 United States",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    success: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    userId: "premium1",
    email: "premium@test.com",
    ipAddress: "203.0.113.45",
    country: "🇦🇺 Australia",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    success: true,
    createdAt: new Date(Date.now() - 3600000),
  },
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    res.json(loginLogs.slice(-100)); // Return last 100 logs
  } catch (error) {
    console.error("Login logs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
