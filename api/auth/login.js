import bcrypt from "bcryptjs";
import { db } from "../../lib/supabase.js";

// IP to country mapping helper
function getCountryFromIP(ip) {
  console.log(`[AUTH] Detecting country for IP: ${ip}`);

  if (ip && ip.includes(":")) {
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

  if (
    (ip && ip.startsWith("192.168.")) ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return "United States";
  }

  return "United States";
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
    const { email, username, password } = req.body;
    console.log(`[LOGIN API] Login attempt for:`, { email, username });

    // Get IP and User Agent
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const country = getCountryFromIP(ip);

    console.log(`[LOGIN API] Request details:`, { ip, userAgent, country });

    if ((!email && !username) || !password) {
      // Log failed attempt
      await db.logLogin({
        user_id: null,
        username: email || username || "unknown",
        ip_address: ip,
        country,
        user_agent: userAgent,
        success: false,
      });

      return res.status(400).json({
        success: false,
        message: "Email/Username and password are required",
      });
    }

    // Find user by email or username
    let user;
    try {
      if (email) {
        const { data, error } = await db
          .getSupabaseAdmin()
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (!error) user = data;
      } else if (username) {
        user = await db.getUserByUsername(username);
      }
    } catch (error) {
      console.log(`[LOGIN API] User lookup error:`, error.message);
    }

    if (!user) {
      console.log(`[LOGIN API] ❌ User not found: ${email || username}`);

      // Log failed attempt
      await db.logLogin({
        user_id: null,
        username: email || username,
        ip_address: ip,
        country,
        user_agent: userAgent,
        success: false,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      console.log(`[LOGIN API] ❌ Invalid password for ${user.username}`);

      // Log failed attempt
      await db.logLogin({
        user_id: user.id,
        username: user.username,
        ip_address: ip,
        country,
        user_agent: userAgent,
        success: false,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Log successful attempt
    await db.logLogin({
      user_id: user.id,
      username: user.username,
      ip_address: ip,
      country,
      user_agent: userAgent,
      success: true,
    });

    console.log(`[LOGIN API] ✅ Successful login for ${user.username}`);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        userId: user.id,
        username: user.username,
        email: user.email,
        type: user.role,
        country: user.country,
        active: user.is_active,
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
