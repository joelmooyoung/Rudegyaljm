// User statistics endpoint
const users = [
  { role: "admin", isActive: true },
  { role: "premium", isActive: true },
  { role: "free", isActive: true },
  { role: "free", isActive: false },
  { role: "premium", isActive: true },
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
    const stats = {
      totalUsers: users.length,
      adminUsers: users.filter((u) => u.role === "admin").length,
      premiumUsers: users.filter((u) => u.role === "premium").length,
      activeUsers: users.filter((u) => u.isActive).length,
    };

    res.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
