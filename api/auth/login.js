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
        return "United States";
      }
    }

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

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

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

    if (!user) {
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
  }
}
