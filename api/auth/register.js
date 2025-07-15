import bcrypt from "bcryptjs";
import { db } from "../../lib/supabase.js";

export default async function handler(req, res) {
  console.log(`[AUTH REGISTER] ${req.method} /api/auth/register`);

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
    const { username, email, password, role = "free" } = req.body;
    console.log(`[AUTH REGISTER] Registration attempt for: ${username}`);

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Validate role
    const validRoles = ["admin", "premium", "free"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Check if user already exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      console.log(`[AUTH REGISTER] Username already exists: ${username}`);
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db.createUser({
      username,
      email,
      password_hash: hashedPassword,
      role,
      country: "United States", // Default country
      is_active: true,
    });

    console.log(
      `[AUTH REGISTER] ✅ User created successfully: ${username} (${role})`,
    );

    // Remove sensitive data
    const { password_hash, ...userResponse } = newUser;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error(`[AUTH REGISTER] Error:`, error);

    // Log error to database
    try {
      await db.logError({
        error_type: "REGISTER_ERROR",
        error_message: error.message,
        stack_trace: error.stack,
        request_path: "/api/auth/register",
      });
    } catch (logError) {
      console.error(`[AUTH REGISTER] Failed to log error:`, logError);
    }

    // Handle duplicate constraints
    if (error.code === "23505") {
      // PostgreSQL unique violation
      if (error.detail?.includes("username")) {
        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }
      if (error.detail?.includes("email")) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
