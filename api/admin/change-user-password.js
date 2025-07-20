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
  console.log(
    `[ADMIN CHANGE PASSWORD API] ${req.method} /api/admin/change-user-password`,
  );

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

    const { adminUserId, targetUserId, newPassword, generatePassword } =
      req.body;

    console.log(`[ADMIN CHANGE PASSWORD API] Request:`, {
      adminUserId,
      targetUserId,
      generatePassword,
    });

    if (!adminUserId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Admin user ID and target user ID are required",
      });
    }

    // Verify admin user exists and has admin role
    let adminUser = await User.findOne({ userId: adminUserId });

    // If not found by userId, try other methods
    if (!adminUser) {
      adminUser = await User.findById(adminUserId);
    }

    if (!adminUser) {
      console.log(
        `[ADMIN CHANGE PASSWORD] Admin user not found with ID: ${adminUserId}`,
      );
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    // Check admin permissions (handle both 'type' and 'role' fields)
    const userRole = adminUser.type || adminUser.role;
    if (userRole !== "admin") {
      console.log(
        `[ADMIN CHANGE PASSWORD] User ${adminUserId} has role '${userRole}', not admin`,
      );
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions. Admin role required.",
      });
    }

    // Find the target user
    let targetUser = await User.findOne({ userId: targetUserId });

    // If not found by userId, try other methods
    if (!targetUser) {
      targetUser = await User.findById(targetUserId);
    }

    if (!targetUser) {
      console.log(
        `[ADMIN CHANGE PASSWORD] Target user not found with ID: ${targetUserId}`,
      );
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    let finalPassword = newPassword;

    // Generate a strong password if requested
    if (generatePassword) {
      const generateStrongPassword = (length = 16) => {
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

        // Ensure at least one character from each category
        let password = "";
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];

        // Fill the rest randomly
        const allChars = uppercase + lowercase + numbers + symbols;
        for (let i = password.length; i < length; i++) {
          password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password to avoid predictable patterns
        return password
          .split("")
          .sort(() => Math.random() - 0.5)
          .join("");
      };

      finalPassword = generateStrongPassword(16);
    }

    if (!finalPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(finalPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "New password does not meet security requirements",
        errors: passwordValidation.errors,
      });
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(
      finalPassword,
      targetUser.password,
    );
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // Hash the new password
    const saltRounds = 12; // Strong salt rounds
    const hashedNewPassword = await bcrypt.hash(finalPassword, saltRounds);

    // Update the target user's password using the correct identifier
    await User.findOneAndUpdate(
      { _id: targetUser._id },
      {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    );

    console.log(
      `[ADMIN CHANGE PASSWORD] ✅ Admin ${adminUser.username} changed password for user: ${targetUser.username} (${targetUserId})`,
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: {
        targetUserId,
        targetUsername: targetUser.username,
        changedBy: adminUser.username,
        changedAt: new Date(),
        generatedPassword: generatePassword ? finalPassword : undefined, // Return generated password if requested
      },
    });
  } catch (error) {
    console.error(`[ADMIN CHANGE PASSWORD API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
