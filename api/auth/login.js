// User authentication API with MongoDB integration
import { connectToDatabase } from "../../lib/mongodb.js";
import { User, LoginLog } from "../../models/index.js";

// Function to detect country from IP
function getCountryFromIP(ip) {
  console.log(`[AUTH] Detecting country for IP: ${ip}`);

  // Handle IPv6 addresses
  if (ip && ip.includes(":")) {
    // Check for common US IPv6 prefixes
    const commonUSPrefixes = [
      "2601:", // Comcast/Xfinity
      "2600:", // AT&T
      "2604:", // Shaw (Canada, but often shows as US)
      "2605:", // Various US ISPs
      "2607:", // Comcast Business
      "2620:", // Various organizations
      "::ffff:", // IPv4-mapped IPv6
    ];

    for (const prefix of commonUSPrefixes) {
      if (ip.startsWith(prefix)) {
        console.log(`[AUTH] IPv6 IP ${ip} matches US prefix ${prefix}`);
        return "United States";
      }
    }

    console.log(`[AUTH] Unknown IPv6 IP ${ip}, defaulting to US`);
    return "United States";
  }

  // Handle IPv4 addresses - basic detection
  if (
    (ip && ip.startsWith("192.168.")) ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return "United States"; // Local network, assume US
  }

  return "United States"; // Default fallback
}

export default async function handler(req, res) {
  console.log(`[LOGIN API] ${req.method} /api/auth/login`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectToDatabase();

    const { email, password } = req.body;
    console.log(`[LOGIN API] Login attempt for email: ${email}`);

    // Get IP and User Agent
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const country = getCountryFromIP(ip);

    console.log(`[LOGIN API] Request details:`, { ip, userAgent, country });

    if (!email || !password) {
      // Log failed attempt
      await LoginLog.create({
        logId: Date.now().toString(),
        userId: "unknown",
        username: email || "unknown",
        ip,
        country,
        userAgent,
        success: false,
      });

      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    let user = await User.findOne({ email });

    // If user doesn't exist, create test accounts on first login attempt
    if (!user) {
      console.log(
        `[LOGIN API] User not found, checking if this is a test account`,
      );

      const testAccounts = [
        {
          userId: "admin1",
          username: "admin",
          email: "admin@test.com",
          password: "admin123",
          type: "admin",
          country,
        },
        {
          userId: "premium1",
          username: "premiumuser",
          email: "premium@test.com",
          password: "premium123",
          type: "premium",
          country,
        },
        {
          userId: "free1",
          username: "freeuser",
          email: "free@test.com",
          password: "free123",
          type: "free",
          country,
        },
      ];

      const testAccount = testAccounts.find((acc) => acc.email === email);
      if (testAccount) {
        user = new User(testAccount);
        await user.save();
        console.log(`[LOGIN API] Created test account: ${email}`);
      }
    }

    if (!user || user.password !== password) {
      // Log failed attempt
      await LoginLog.create({
        logId: Date.now().toString(),
        userId: user?.userId || "unknown",
        username: user?.username || email,
        ip,
        country,
        userAgent,
        success: false,
      });

      console.log(`[LOGIN API] ❌ Invalid credentials for ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update user login stats
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    user.country = country;
    await user.save();

    // Log successful attempt
    await LoginLog.create({
      logId: Date.now().toString(),
      userId: user.userId,
      username: user.username,
      ip,
      country,
      userAgent,
      success: true,
    });

    console.log(`[LOGIN API] ✅ Successful login for ${user.username}`);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        type: user.type,
        country: user.country,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
      },
    });
  } catch (error) {
    console.error(`[LOGIN API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
