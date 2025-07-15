// Toggle user active status
let users = [
  {
    id: "admin1",
    email: "admin@nocturne.com",
    username: "admin",
    role: "admin",
    isActive: true,
  },
  {
    id: "premium1",
    email: "premium@test.com",
    username: "premiumuser",
    role: "premium",
    isActive: true,
  },
  {
    id: "free1",
    email: "free@test.com",
    username: "freeuser",
    role: "free",
    isActive: true,
  },
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    users[userIndex].isActive = !users[userIndex].isActive;
    res.json(users[userIndex]);
  } catch (error) {
    console.error("Toggle user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
