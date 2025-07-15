// Vercel serverless function for user management
let users = [
  {
    id: "admin1",
    email: "admin@nocturne.com",
    username: "admin",
    role: "admin",
    isAgeVerified: true,
    isActive: true,
    subscriptionStatus: "none",
    createdAt: new Date("2024-01-01"),
    lastLogin: new Date(),
  },
  {
    id: "premium1",
    email: "premium@test.com",
    username: "premiumuser",
    role: "premium",
    isAgeVerified: true,
    isActive: true,
    subscriptionStatus: "active",
    subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-01-10"),
    lastLogin: new Date(),
  },
  {
    id: "free1",
    email: "free@test.com",
    username: "freeuser",
    role: "free",
    isAgeVerified: true,
    isActive: true,
    subscriptionStatus: "none",
    createdAt: new Date("2024-01-15"),
    lastLogin: new Date(),
  },
  {
    id: "free2",
    email: "reader@example.com",
    username: "storyreader",
    role: "free",
    isAgeVerified: true,
    isActive: false,
    subscriptionStatus: "none",
    createdAt: new Date("2024-02-01"),
    lastLogin: new Date("2024-02-01"),
  },
  {
    id: "premium2",
    email: "vip@example.com",
    username: "vipuser",
    role: "premium",
    isAgeVerified: true,
    isActive: true,
    subscriptionStatus: "active",
    subscriptionExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    createdAt: new Date("2024-02-10"),
    lastLogin: new Date(),
  },
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case "GET":
        if (id) {
          // Get single user
          const user = users.find((u) => u.id === id);
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
          res.json(user);
        } else {
          // Get all users
          res.json(users);
        }
        break;

      case "POST":
        // Create new user
        const newUser = {
          id: Date.now().toString(),
          ...req.body,
          createdAt: new Date(),
          lastLogin: null,
        };
        users.push(newUser);
        res.status(201).json(newUser);
        break;

      case "PUT":
        // Update user
        if (!id) {
          return res.status(400).json({ message: "User ID required" });
        }
        const userIndex = users.findIndex((u) => u.id === id);
        if (userIndex === -1) {
          return res.status(404).json({ message: "User not found" });
        }
        users[userIndex] = { ...users[userIndex], ...req.body };
        res.json(users[userIndex]);
        break;

      case "DELETE":
        // Delete user
        if (!id) {
          return res.status(400).json({ message: "User ID required" });
        }
        const deleteIndex = users.findIndex((u) => u.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ message: "User not found" });
        }
        users.splice(deleteIndex, 1);
        res.json({ message: "User deleted successfully" });
        break;

      default:
        res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("User management error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
