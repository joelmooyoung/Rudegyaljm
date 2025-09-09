import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  console.log(
    `[FORCE UPDATE PASSWORD] ${req.method} /api/force-update-password`,
  );

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
      message: "Method not allowed - use POST",
    });
  }

  try {
    const { email, username, newPassword } = req.body;

    if ((!email && !username) || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email or username and newPassword are required",
      });
    }

    console.log(`[FORCE UPDATE PASSWORD] Updating password for:`, { email, username });

    // Connect to database
    await connectToDatabase();
    console.log("[FORCE UPDATE PASSWORD] Database connected");

    // Find user by email or username
    let user = null;
    if (email) {
      user = await User.findOne({ email: String(email).toLowerCase().trim() });
    }
    if (!user && username) {
      user = await User.findOne({ username: String(username).toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    console.log(`[FORCE UPDATE PASSWORD] Found user: ${user.email}`);

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear any reset tokens
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    console.log(
      `[FORCE UPDATE PASSWORD] ✅ Password updated successfully for: ${user.email}`,
    );

    // Test the new password works
    const testResult = await bcrypt.compare(newPassword, user.password);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully in database",
      user: {
        email: user.email,
        username: user.username,
        type: user.type,
        active: user.active,
        lastLogin: user.lastLogin,
        passwordTestPassed: testResult,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[FORCE UPDATE PASSWORD] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update password",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
