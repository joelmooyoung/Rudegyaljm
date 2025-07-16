// Test login endpoint - simplified for Vercel compatibility
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Check environment variables
    const hasMongoUri = !!process.env.MONGODB_URI;

    // Mock test users
    const testUsers = [
      { email: "admin@test.com", password: "admin123", type: "admin" },
      { email: "premium@test.com", password: "premium123", type: "premium" },
      { email: "free@test.com", password: "free123", type: "free" },
    ];

    if (req.method === "GET") {
      return res.status(200).json({
        success: true,
        message: "Login test endpoint working",
        environment: {
          hasMongoUri,
          nodeEnv: process.env.NODE_ENV || "not set",
        },
        testUsers: testUsers.map((u) => ({
          email: u.email,
          password: u.password,
        })),
      });
    }

    if (req.method === "POST") {
      const { email, password } = req.body;

      // Simple test authentication
      const user = testUsers.find(
        (u) => u.email === email && u.password === password,
      );

      if (user) {
        return res.status(200).json({
          success: true,
          message: "Login successful (test mode)",
          user: {
            userId: `test-${user.type}`,
            username: user.type,
            email: user.email,
            type: user.type,
            country: "United States",
          },
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}
