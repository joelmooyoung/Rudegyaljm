import { RequestHandler } from "express";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  LoginLog,
  ErrorLog,
} from "@shared/api";

// Mock data storage (replace with real database)
const users: User[] = [
  {
    id: "admin1",
    email: "admin@nocturne.com",
    username: "admin",
    role: "admin",
    isAgeVerified: true,
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

// Helper function to log login attempts
const logLogin = (userId: string, success: boolean, req: any): void => {
  const log: LoginLog = {
    id: Date.now().toString(),
    userId,
    ipAddress: req.ip || req.connection.remoteAddress || "unknown",
    country: "Unknown", // In real app, use IP geolocation service
    userAgent: req.get("User-Agent") || "unknown",
    success,
    createdAt: new Date(),
  };
  loginLogs.push(log);
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
      logLogin("unknown", false, req);
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
      logLogin(user.id, false, req);
      logError(
        `Failed login attempt for user: ${user.id}`,
        req,
        user.id,
        "medium",
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    logLogin(user.id, true, req);

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
      subscriptionStatus: "none",
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    users.push(newUser);
    logLogin(newUser.id, true, req);

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
