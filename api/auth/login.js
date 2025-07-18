import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../lib/mongodb.js";
import { User, LoginLog } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[LOGIN API] ${req.method} /api/auth/login`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // Connect to database
    await connectToDatabase();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    console.log(`[LOGIN API] Attempting login for: ${email}`);

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`[LOGIN API] User not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.active) {
      console.log(`[LOGIN API] User inactive: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Account is inactive. Please contact administrator.",
      });
    }

    // Check password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log(`[LOGIN API] Invalid password for: ${email}`);

      // Log failed login attempt
      try {
        const failedLoginLog = new LoginLog({
          logId: `failed_${Date.now()}`,
          userId: user.userId,
          username: user.username,
          ip:
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            "unknown",
          country: "Unknown",
          userAgent: req.headers["user-agent"] || "Unknown",
          success: false,
          timestamp: new Date(),
        });
        await failedLoginLog.save();
      } catch (logError) {
        console.error("Failed to log failed login attempt:", logError);
      }

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update login stats
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Create successful login log
    try {
      const loginLog = new LoginLog({
        logId: `success_${Date.now()}`,
        userId: user.userId,
        username: user.username,
        ip:
          req.headers["x-forwarded-for"] ||
          req.socket.remoteAddress ||
          "unknown",
        country: "Unknown", // Could be enhanced with IP geolocation
        userAgent: req.headers["user-agent"] || "Unknown",
        success: true,
        timestamp: new Date(),
      });
      await loginLog.save();
    } catch (logError) {
      console.error("Failed to log successful login:", logError);
    }

    // Generate simple token (in production, use JWT)
    const token = `auth_${user.userId}_${Date.now()}`;

    console.log(`[LOGIN API] ✅ Login successful for: ${email}`);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user.userId,
        email: user.email,
        username: user.username,
        role: user.type, // Map type to role for frontend compatibility
        isActive: user.active,
        isAgeVerified: true, // Assume verified after login
        subscriptionStatus: user.type === "premium" ? "active" : "none",
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("[LOGIN API] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
