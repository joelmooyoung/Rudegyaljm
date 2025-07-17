import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  LoginLog,
  ErrorLog,
} from "@shared/api";
import {
  UserModel,
  LoginLogModel,
  ErrorLogModel,
  toUserResponse,
  toLoginLogResponse,
  toErrorLogResponse,
} from "../models";
import { createLoginLog } from "../utils/auth-logging";

// Helper function to generate JWT-like token (mock - in production use proper JWT)
const generateToken = (userId: string): string => {
  return `token_${userId}_${Date.now()}`;
};

// Helper function to log errors to MongoDB
const logError = async (
  error: string,
  req: any,
  userId?: string,
  severity: "low" | "medium" | "high" | "critical" = "medium",
  stack?: string,
): Promise<void> => {
  try {
    const errorLog = new ErrorLogModel({
      userId,
      error,
      stack,
      endpoint: req.originalUrl,
      method: req.method,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
      userAgent: req.get("User-Agent") || "unknown",
      severity,
    });

    await errorLog.save();
    console.log(`[ERROR] ${severity.toUpperCase()}: ${error}`);
  } catch (logErr) {
    console.error("Failed to log error to database:", logErr);
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      await logError(
        "Login attempt with missing credentials",
        req,
        undefined,
        "low",
      );
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user by email
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      await logError(
        `Login attempt with non-existent email: ${email}`,
        req,
        undefined,
        "medium",
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      await logError(
        `Login attempt by inactive user: ${user._id}`,
        req,
        user._id.toString(),
        "medium",
      );
      return res.status(401).json({ message: "Account is inactive" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      await logError(
        `Failed login attempt for user: ${user._id}`,
        req,
        user._id.toString(),
        "medium",
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    const loginLog = createLoginLog(user._id.toString(), user.email, req);
    const loginLogDoc = new LoginLogModel(loginLog);
    await loginLogDoc.save();

    const token = generateToken(user._id.toString());
    const response: AuthResponse = {
      user: toUserResponse(user),
      token,
      message: "Login successful",
    };

    res.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Login failed";
    const stack = error instanceof Error ? error.stack : undefined;
    await logError(
      `Login error: ${errorMessage}`,
      req,
      undefined,
      "high",
      stack,
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { email, username, password, dateOfBirth }: RegisterRequest =
      req.body;

    if (!email || !username || !password || !dateOfBirth) {
      await logError(
        "Registration attempt with missing fields",
        req,
        undefined,
        "low",
      );
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      await logError(
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
      await logError(
        `Underage registration attempt: ${age} years old`,
        req,
        undefined,
        "high",
      );
      return res
        .status(400)
        .json({ message: "You must be 18 or older to register" });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new UserModel({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: passwordHash,
      role: "free",
      isAgeVerified: true,
      isActive: true,
      subscriptionStatus: "none",
      lastLogin: new Date(),
    });

    const savedUser = await newUser.save();

    // Log successful registration/login
    const loginLog = createLoginLog(
      savedUser._id.toString(),
      savedUser.email,
      req,
    );
    const loginLogDoc = new LoginLogModel(loginLog);
    await loginLogDoc.save();

    const token = generateToken(savedUser._id.toString());
    const response: AuthResponse = {
      user: toUserResponse(savedUser),
      token,
      message: "Registration successful",
    };

    res.status(201).json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    const stack = error instanceof Error ? error.stack : undefined;
    await logError(
      `Registration error: ${errorMessage}`,
      req,
      undefined,
      "critical",
      stack,
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin endpoint to get login logs
export const getLoginLogs: RequestHandler = async (req, res) => {
  try {
    const logs = await LoginLogModel.find().sort({ createdAt: -1 }).limit(100);

    const response = logs.map(toLoginLogResponse);
    res.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch logs";
    await logError(
      `Error fetching login logs: ${errorMessage}`,
      req,
      undefined,
      "medium",
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin endpoint to get error logs
export const getErrorLogs: RequestHandler = async (req, res) => {
  try {
    const logs = await ErrorLogModel.find().sort({ createdAt: -1 }).limit(100);

    const response = logs.map(toErrorLogResponse);
    res.json(response);
  } catch (error) {
    console.error("Error fetching error logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin endpoint to clear logs
export const clearLogs: RequestHandler = async (req, res) => {
  try {
    const { type } = req.body;

    if (type === "login" || type === "all") {
      await LoginLogModel.deleteMany({});
    }
    if (type === "error" || type === "all") {
      await ErrorLogModel.deleteMany({});
    }

    res.json({ message: `${type} logs cleared successfully` });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to clear logs";
    await logError(
      `Error clearing logs: ${errorMessage}`,
      req,
      undefined,
      "medium",
    );
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
