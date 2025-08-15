import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[DEBUG USER PASSWORD] ${req.method} /api/debug-user-password`);

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
      message: "Method not allowed - use POST with email and password",
    });
  }

  try {
    const { email, testPassword } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    console.log(`[DEBUG USER PASSWORD] Checking user: ${email}`);

    // Try database first
    let dbResult = null;
    try {
      await connectToDatabase();
      console.log("[DEBUG USER PASSWORD] Database connected");

      const user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        dbResult = {
          found: true,
          email: user.email,
          username: user.username,
          type: user.type,
          active: user.active,
          hasPassword: !!user.password,
          passwordLength: user.password ? user.password.length : 0,
          passwordPrefix: user.password
            ? user.password.substring(0, 10) + "..."
            : null,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount,
          resetToken: user.resetToken ? "Present" : "None",
          resetTokenExpiry: user.resetTokenExpiry,
        };

        // Test password if provided
        if (testPassword && user.password) {
          const isValidPassword = await bcrypt.compare(
            testPassword,
            user.password,
          );
          dbResult.passwordTest = {
            provided: testPassword,
            isValid: isValidPassword,
          };
        }
      } else {
        dbResult = {
          found: false,
          message: "User not found in database",
        };
      }
    } catch (dbError) {
      dbResult = {
        error: true,
        message: "Database connection failed",
        details: dbError.message,
      };
    }

    // Check local users fallback
    let localResult = null;
    try {
      const { getUserByEmail, initializeLocalUsers } = await import(
        "../lib/local-users.js"
      );
      await initializeLocalUsers();

      const localUser = await getUserByEmail(email);

      if (localUser) {
        localResult = {
          found: true,
          email: localUser.email,
          username: localUser.username,
          type: localUser.type,
          active: localUser.active,
          hasPassword: !!localUser.password,
          passwordLength: localUser.password ? localUser.password.length : 0,
          passwordPrefix: localUser.password
            ? localUser.password.substring(0, 10) + "..."
            : null,
          lastLogin: localUser.lastLogin,
          loginCount: localUser.loginCount,
        };

        // Test password if provided
        if (testPassword && localUser.password) {
          const isValidPassword = await bcrypt.compare(
            testPassword,
            localUser.password,
          );
          localResult.passwordTest = {
            provided: testPassword,
            isValid: isValidPassword,
          };
        }
      } else {
        localResult = {
          found: false,
          message: "User not found in local storage",
        };
      }
    } catch (localError) {
      localResult = {
        error: true,
        message: "Local user check failed",
        details: localError.message,
      };
    }

    return res.status(200).json({
      success: true,
      message: "User password debug completed",
      email: email,
      databaseResult: dbResult,
      localResult: localResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DEBUG USER PASSWORD] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Debug failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
