import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";

// Server-side password validation (matches client-side validation)
function validatePassword(password) {
  const errors = [];

  // Minimum length requirement
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // Uppercase letter requirement
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Lowercase letter requirement
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Number requirement
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Special character requirement
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)",
    );
  }

  // Check for common patterns to avoid
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123|234|345|456|567|678|789|890/, // Sequential numbers
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
    /password|123456|qwerty|admin|letmein|welcome|monkey|dragon|princess|football|baseball|basketball|superman|batman|master|shadow|jordan|harley/i, // Common passwords
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push(
        "Password contains common patterns and may be easily guessed",
      );
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default async function handler(req, res) {
  console.log(`[CHANGE PASSWORD API] ${req.method} /api/auth/change-password`);

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
    // Connect to MongoDB
    const dbConnection = await connectToDatabase();

    if (!dbConnection.isConnected) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const {
      userId,
      currentPassword,
      newPassword,
      isAdminRequest = false,
    } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "User ID and new password are required",
      });
    }

    // For non-admin requests, current password is required
    if (!isAdminRequest && !currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "New password does not meet security requirements",
        errors: passwordValidation.errors,
      });
    }

    // Find the user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // For non-admin requests, verify current password
    if (!isAdminRequest) {
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // Hash the new password
    const saltRounds = 12; // Strong salt rounds
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    await User.findOneAndUpdate(
      { userId },
      {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    );

    console.log(
      `[CHANGE PASSWORD] ✅ Password changed for user: ${user.username} (${userId})`,
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: {
        userId,
        username: user.username,
        changedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[CHANGE PASSWORD API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
