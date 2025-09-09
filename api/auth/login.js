import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../lib/mongodb.js";
import { User, LoginLog } from "../../models/index.js";
import { getCountryFromIP, getCityFromIP } from "../../server/utils/geolocation.js";

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

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  console.log(`[LOGIN API] Attempting login for: ${email}`);

  // Try database authentication first
  try {
    await connectToDatabase();
    console.log("[LOGIN API] Database connected, trying database auth");

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log(`[LOGIN API] Database user lookup result:`, {
      found: !!user,
      email: user?.email,
      username: user?.username,
      type: user?.type,
      active: user?.active,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length || 0,
    });

    if (user && user.active) {
      console.log(`[LOGIN API] Testing password for user: ${user.email}`);
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log(`[LOGIN API] Password validation result: ${isValidPassword}`);

      if (isValidPassword) {
        console.log("[LOGIN API] ✅ Database login successful");

        // Update login stats
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        // Create successful login log
        try {
          // Extract IP address with proper header checking
          const rawIP = req.headers["x-forwarded-for"] ||
                       req.headers["x-real-ip"] ||
                       req.socket.remoteAddress ||
                       "unknown";

          // Clean IP if it has multiple IPs (take first one)
          const clientIP = rawIP.includes(',') ? rawIP.split(',')[0].trim() : rawIP;

          // Get country and city from IP using geolocation
          const country = getCountryFromIP(clientIP);
          const city = getCityFromIP(clientIP);

          console.log(`[LOGIN API] IP geolocation: ${rawIP} -> ${clientIP} -> ${country}, ${city}`);

          const loginLog = new LoginLog({
            logId: `success_${Date.now()}`,
            userId: user.userId,
            username: user.username,
            ip: clientIP,
            country: country,
            city: city,
            userAgent: req.headers["user-agent"] || "Unknown",
            success: true,
            timestamp: new Date(),
          });
          await loginLog.save();
        } catch (logError) {
          console.error("Failed to log successful login:", logError);
        }

        const token = `db_token_${user.userId}_${Date.now()}`;

        return res.status(200).json({
          success: true,
          message: "Login successful",
          token: token,
          user: {
            id: user.userId,
            email: user.email,
            username: user.username,
            role: user.type,
            isActive: user.active,
            isAgeVerified: true,
            subscriptionStatus: user.type === "premium" ? "active" : "none",
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          },
        });
      }
    }
  } catch (dbError) {
    console.error(
      "[LOGIN API] Database failed, trying local users:",
      dbError.message,
    );

    // Fallback to local users when database is unavailable
    try {
      const { authenticateUser, initializeLocalUsers } = await import(
        "../../lib/local-users.js"
      );

      // Initialize local users if needed
      await initializeLocalUsers();

      console.log("[LOGIN API] Trying local authentication");

      // First check if user exists in local storage
      const { getUserByEmail } = await import("../../lib/local-users.js");
      const localUser = await getUserByEmail(email);
      console.log(`[LOGIN API] Local user lookup result:`, {
        found: !!localUser,
        email: localUser?.email,
        username: localUser?.username,
        type: localUser?.type,
        active: localUser?.active,
        hasPassword: !!localUser?.password,
        passwordLength: localUser?.password?.length || 0,
      });

      const user = await authenticateUser(email, password);
      console.log(`[LOGIN API] Local authentication result: ${!!user}`);

      if (user) {
        console.log("[LOGIN API] ✅ Local authentication successful");
        const token = `local_token_${user.id}_${Date.now()}`;

        return res.status(200).json({
          success: true,
          message: "Login successful (local)",
          token: token,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.type,
            isActive: user.active,
            isAgeVerified: true,
            subscriptionStatus: user.type === "premium" ? "active" : "none",
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          },
        });
      }
    } catch (localError) {
      console.error(
        "[LOGIN API] Local authentication failed:",
        localError.message,
      );
    }
  }

  console.log("[LOGIN API] ❌ All authentication methods failed");
  return res.status(401).json({
    success: false,
    message: "Invalid email or password",
  });
}
