// Vercel serverless function for login
const users = [
  {
    id: "admin1",
    email: "admin@nocturne.com",
    username: "admin",
    role: "admin",
    isAgeVerified: true,
    isActive: true,
    subscriptionStatus: "none",
    createdAt: new Date(),
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
    createdAt: new Date(),
  },
  {
    id: "free1",
    email: "free@test.com",
    username: "freeuser",
    role: "free",
    isAgeVerified: true,
    isActive: true,
    subscriptionStatus: "none",
    createdAt: new Date(),
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

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user by email
    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // For demo, accept any password for existing users
    if (password.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate simple token
    const token = `token_${user.id}_${Date.now()}`;

    const response = {
      user,
      token,
      message: "Login successful",
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
