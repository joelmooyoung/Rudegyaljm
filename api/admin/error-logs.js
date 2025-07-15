// Error logs API
const errorLogs = [
  {
    id: "1",
    userId: "free1",
    error: "Failed to load premium content",
    endpoint: "/api/stories/premium",
    method: "GET",
    ipAddress: "192.168.1.50",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
    severity: "medium",
    createdAt: new Date(),
  },
  {
    id: "2",
    userId: null,
    error: "Login attempt with invalid credentials",
    endpoint: "/api/auth/login",
    method: "POST",
    ipAddress: "203.0.113.100",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    severity: "low",
    createdAt: new Date(Date.now() - 1800000),
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
    res.json(errorLogs.slice(-100)); // Return last 100 logs
  } catch (error) {
    console.error("Error logs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
