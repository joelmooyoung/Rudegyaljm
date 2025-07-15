// Vercel serverless function for registration
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
    const { email, username, password, dateOfBirth } = req.body;

    if (!email || !username || !password || !dateOfBirth) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Verify age
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      return res
        .status(400)
        .json({ message: "You must be 18 or older to register" });
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      username,
      role: "free",
      isAgeVerified: true,
      isActive: true,
      subscriptionStatus: "none",
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    // Generate simple token
    const token = `token_${newUser.id}_${Date.now()}`;

    const response = {
      user: newUser,
      token,
      message: "Registration successful",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
