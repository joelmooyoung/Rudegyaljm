import { RequestHandler } from "express";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  LoginLog,
  ErrorLog,
} from "@shared/api";
import { getCountryFromIP as getEnhancedCountryFromIP } from "../utils/geolocation";
import { createLoginLog } from "../utils/auth-logging";

// Mock data storage (replace with real database)
const users: User[] = [
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
    subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
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

const loginLogs: LoginLog[] = [];
const errorLogs: ErrorLog[] = [];

// Helper function to generate JWT-like token (mock)
const generateToken = (userId: string): string => {
  return `token_${userId}_${Date.now()}`;
};

// Helper function to get country from IP (basic implementation)
const getCountryFromIP = (ip: string): string => {
  // Simple mapping for common IPs (in production, use a proper geolocation service)
  if (ip.startsWith("127.0.0.1") || ip === "::1") return "Local";
  if (
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  )
    return "Private Network";
  if (ip.startsWith("203.")) return "Australia";
  if (ip.startsWith("185.")) return "Europe";
  if (ip.startsWith("104.") || ip.startsWith("76.")) return "United States";
  if (ip.startsWith("216.")) return "Canada";
  if (ip.startsWith("196.")) return "South Africa";
  if (ip.startsWith("41.")) return "Africa";
  if (ip.startsWith("220.")) return "Asia";
  return "Unknown";
};

// Helper function to extract real IP address (handles proxies, load balancers)
const extractRealIP = (req: any): string => {
  // Check X-Forwarded-For header (most common for proxies)
  const forwardedFor = req.get("X-Forwarded-For");
  if (forwardedFor) {
    const ips = forwardedFor.split(",");
    return ips[0].trim(); // Get the first (original) IP
  }

  // Check other common proxy headers
  const realIP = req.get("X-Real-IP");
  if (realIP) return realIP.trim();

  const clientIP = req.get("X-Client-IP");
  if (clientIP) return clientIP.trim();

  // Fallback to connection IP
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

// Helper function to log successful login attempts only
const logSuccessfulLogin = (userId: string, email: string, req: any): void => {
  const ipAddress =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown";
  const log: LoginLog = {
    id: Date.now().toString(),
    userId,
    email,
    ipAddress,
    country: getEnhancedCountryFromIP(ipAddress),
    userAgent: req.get("User-Agent") || "unknown",
    success: true,
    createdAt: new Date(),
  };
  loginLogs.push(log);
  console.log(
    `[LOGIN] User ${email} (${userId}) logged in from ${ipAddress} (${log.country})`,
  );
};

// Helper function to log errors
const logError = (
  error: string,
  req: any,
  userId?: string,
  severity: "low" | "medium" | "high" | "critical" = "medium",
): void => {
  const log: ErrorLog = {
    id: Date.now().toString(),
    userId,
    error,
    endpoint: req.originalUrl,
    method: req.method,
    ipAddress: req.ip || req.connection.remoteAddress || "unknown",
    userAgent: req.get("User-Agent") || "unknown",
    severity,
    createdAt: new Date(),
  };
  errorLogs.push(log);
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      logError("Login attempt with missing credentials", req, undefined, "low");
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user by email
    const user = users.find((u) => u.email === email);

    if (!user) {
      logError(
        `Login attempt with non-existent email: ${email}`,
        req,
        undefined,
        "medium",
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // In a real app, you'd verify the password hash
    // For demo purposes, accept any password for existing users
    const isValidPassword = password.length > 0;

    if (!isValidPassword) {
      logError(
        `Failed login attempt for user: ${user.id}`,
        req,
        user.id,
        "medium",
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login and log successful login
    user.lastLogin = new Date();
    const loginLog = createLoginLog(user.id, user.email, req);
    loginLogs.push(loginLog);

    const token = generateToken(user.id);
    const response: AuthResponse = {
      user,
      token,
      message: "Login successful",
    };

    res.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Login failed";
    logError(`Login error: ${errorMessage}`, req, undefined, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { email, username, password, dateOfBirth }: RegisterRequest =
      req.body;

    if (!email || !username || !password || !dateOfBirth) {
      logError(
        "Registration attempt with missing fields",
        req,
        undefined,
        "low",
      );
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = users.find(
      (u) => u.email === email || u.username === username,
    );

    if (existingUser) {
      logError(
        `Registration attempt with existing email/username: ${email}/${username}`,
        req,
        undefined,
        "medium",
      );
      return res
        .status(409)
        .json({ message: "User with this email or username already exists" });
    }

    // Verify age (additional server-side check)
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
      logError(
        `Underage registration attempt: ${age} years old`,
        req,
        undefined,
        "high",
      );
      return res
        .status(400)
        .json({ message: "You must be 18 or older to register" });
    }

    // Create new user
    const newUser: User = {
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

    users.push(newUser);
    const loginLog = createLoginLog(newUser.id, newUser.email, req);
    loginLogs.push(loginLog);

    const token = generateToken(newUser.id);
    const response: AuthResponse = {
      user: newUser,
      token,
      message: "Registration successful",
    };

    res.status(201).json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    logError(`Registration error: ${errorMessage}`, req, undefined, "critical");
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin endpoint to get login logs
export const getLoginLogs: RequestHandler = (req, res) => {
  try {
    // In a real app, verify admin permissions
    res.json(loginLogs.slice(-100)); // Return last 100 logs
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch logs";
    logError(
      `Error fetching login logs: ${errorMessage}`,
      req,
      undefined,
      "medium",
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin endpoint to get error logs
export const getErrorLogs: RequestHandler = (req, res) => {
  try {
    // In a real app, verify admin permissions
    res.json(errorLogs.slice(-100)); // Return last 100 logs
  } catch (error) {
    console.error("Error fetching error logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin endpoint to clear logs
export const clearLogs: RequestHandler = (req, res) => {
  try {
    const { type } = req.body;

    if (type === "login" || type === "all") {
      loginLogs.length = 0;
    }
    if (type === "error" || type === "all") {
      errorLogs.length = 0;
    }

    res.json({ message: `${type} logs cleared successfully` });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to clear logs";
    logError(`Error clearing logs: ${errorMessage}`, req, undefined, "medium");
    res.status(500).json({ message: "Internal server error" });
  }
};

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
