<<<<<<< HEAD
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
=======
import bcrypt from "bcryptjs";
import { db } from "../../lib/supabase.js";

// IP to country mapping helper
function getCountryFromIP(ip) {
  console.log(`[AUTH] Detecting country for IP: ${ip}`);

  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return "United States"; // Default for localhost
  }

  // IPv6 address handling - enhanced detection
  if (ip.includes(":")) {
    console.log(`[AUTH] IPv6 address detected: ${ip}`);

    // Common US ISP IPv6 prefixes
    const usIPv6Prefixes = [
      "2601:", // Comcast/Xfinity
      "2602:", // Charter/Spectrum
      "2603:", // Microsoft
      "2604:", // Various US ISPs
      "2605:", // Various US ISPs
      "2606:", // AT&T
      "2607:", // Verizon
      "2620:", // Various US organizations
      "2001:558:", // Comcast
      "2001:4888:", // Charter
    ];

    for (const prefix of usIPv6Prefixes) {
      if (ip.startsWith(prefix)) {
        console.log(`[AUTH] Matched US IPv6 prefix: ${prefix}`);
>>>>>>> 5a56b8ea6e425b9ec097296fbb24a05ee5163ac4
        return "United States";
      }
    }

<<<<<<< HEAD
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
=======
    // If no specific match, still default to US for unrecognized IPv6
    console.log(`[AUTH] Unrecognized IPv6, defaulting to US`);
    return "United States";
  }

  // IPv4 address handling
  const ipParts = ip.split(".");
  if (ipParts.length === 4) {
    const firstOctet = parseInt(ipParts[0]);

    // US IP ranges (simplified)
    if (
      (firstOctet >= 3 && firstOctet <= 6) ||
      (firstOctet >= 8 && firstOctet <= 15) ||
      (firstOctet >= 17 && firstOctet <= 30) ||
      (firstOctet >= 32 && firstOctet <= 45) ||
      (firstOctet >= 47 && firstOctet <= 75) ||
      (firstOctet >= 96 && firstOctet <= 126) ||
      (firstOctet >= 128 && firstOctet <= 191)
    ) {
      return "United States";
    }
  }

  return "Unknown Region";
}

function getClientIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const realIP = req.headers["x-real-ip"];
  const remoteAddr = req.connection?.remoteAddress || req.socket?.remoteAddress;

  let ip = forwarded || realIP || remoteAddr || "127.0.0.1";

  // Handle comma-separated IPs (take first one)
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // Remove IPv6 wrapper if present
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  console.log(`[AUTH] Extracted IP: ${ip} from headers:`, {
    forwarded,
    realIP,
    remoteAddr,
  });

  return ip;
}

export default async function handler(req, res) {
  console.log(`[AUTH LOGIN] ${req.method} /api/auth/login`);
>>>>>>> 5a56b8ea6e425b9ec097296fbb24a05ee5163ac4

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
<<<<<<< HEAD
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
=======
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { username, password } = req.body;
    console.log(`[AUTH LOGIN] Login attempt for username: ${username}`);

    if (!username || !password) {
      console.log(`[AUTH LOGIN] Missing credentials`);
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Get user from database
    const user = await db.getUserByUsername(username);
>>>>>>> 5a56b8ea6e425b9ec097296fbb24a05ee5163ac4

    // If user doesn't exist, create test accounts on first login attempt
    if (!user) {
<<<<<<< HEAD
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
=======
      console.log(`[AUTH LOGIN] User not found: ${username}`);
      await logLoginAttempt(req, username, null, false, "User not found");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      console.log(`[AUTH LOGIN] Invalid password for user: ${username}`);
      await logLoginAttempt(req, username, user.id, false, "Invalid password");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.is_active) {
      console.log(`[AUTH LOGIN] Inactive user attempted login: ${username}`);
      await logLoginAttempt(req, username, user.id, false, "Account inactive");
      return res.status(401).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Successful login
    console.log(
      `[AUTH LOGIN] ✅ Successful login for ${username} (${user.role})`,
    );
    await logLoginAttempt(req, username, user.id, true, "Login successful");

    // Remove sensitive data
    const { password_hash, ...userResponse } = user;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
    });
  } catch (error) {
    console.error(`[AUTH LOGIN] Error:`, error);

    // Log error to database
    try {
      await db.logError({
        error_type: "LOGIN_ERROR",
        error_message: error.message,
        stack_trace: error.stack,
        request_path: "/api/auth/login",
      });
    } catch (logError) {
      console.error(`[AUTH LOGIN] Failed to log error:`, logError);
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function logLoginAttempt(req, username, userId, success, reason) {
  try {
    const ip = getClientIP(req);
    const country = getCountryFromIP(ip);
    const userAgent = req.headers["user-agent"] || "";

    console.log(
      `[AUTH LOGIN] Logging attempt: ${username}, IP: ${ip}, Country: ${country}, Success: ${success}`,
    );

    await db.logLogin({
      user_id: userId,
      username: username,
      ip_address: ip,
      country: country,
      user_agent: userAgent,
      success: success,
    });

    console.log(`[AUTH LOGIN] ✅ Login attempt logged successfully`);
  } catch (error) {
    console.error(`[AUTH LOGIN] Failed to log login attempt:`, error);
>>>>>>> 5a56b8ea6e425b9ec097296fbb24a05ee5163ac4
  }
}
