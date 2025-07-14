import { LoginLog } from "@shared/api";
import { getCountryFromIP } from "./geolocation";

// Enhanced IP extraction function for better geolocation
export const getEnhancedClientIP = (req: any): string => {
  // Check X-Forwarded-For header (most common for proxies/load balancers)
  const forwardedFor = req.get("X-Forwarded-For");
  if (forwardedFor) {
    const ips = forwardedFor.split(",");
    const clientIP = ips[0].trim();
    console.log(
      `[IP] X-Forwarded-For found: ${forwardedFor}, using: ${clientIP}`,
    );
    return clientIP;
  }

  // Check other common proxy headers
  const realIP = req.get("X-Real-IP");
  if (realIP) {
    console.log(`[IP] X-Real-IP found: ${realIP}`);
    return realIP.trim();
  }

  const clientIP = req.get("X-Client-IP");
  if (clientIP) {
    console.log(`[IP] X-Client-IP found: ${clientIP}`);
    return clientIP.trim();
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIP = req.get("CF-Connecting-IP");
  if (cfIP) {
    console.log(`[IP] CF-Connecting-IP found: ${cfIP}`);
    return cfIP.trim();
  }

  // Fallback to connection IP
  const connectionIP =
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    "unknown";

  console.log(`[IP] Using connection IP: ${connectionIP}`);
  return connectionIP;
};

// Enhanced login logging function
export const createLoginLog = (
  userId: string,
  email: string,
  req: any,
): LoginLog => {
  const rawIP = getEnhancedClientIP(req);

  // Clean up IP address (remove IPv6 prefix if present)
  let cleanIP = rawIP;
  if (rawIP.startsWith("::ffff:")) {
    cleanIP = rawIP.substring(7); // Remove IPv6-mapped IPv4 prefix
    console.log(`[IP] Cleaned IPv6-mapped IP: ${rawIP} -> ${cleanIP}`);
  }

  const country = getCountryFromIP(cleanIP);

  const log: LoginLog = {
    id: Date.now().toString(),
    userId,
    email,
    ipAddress: cleanIP,
    country,
    userAgent: req.get("User-Agent") || "unknown",
    success: true,
    createdAt: new Date(),
  };

  console.log(
    `[LOGIN] ✅ User ${email} (${userId}) logged in from ${rawIP} -> ${cleanIP} -> ${country}`,
  );

  return log;
};
