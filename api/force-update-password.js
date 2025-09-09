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
    const { email, username, newPassword, userId } = req.body || {};

    if ((!email && !username && !userId) || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Provide userId or email or username, and newPassword",
      });
    }

    const norm = (s) =>
      typeof s === "string" ? s.trim().toLowerCase() : undefined;
    const emailN = norm(email);
    const usernameN = norm(username);
    const userIdN = typeof userId === "string" ? userId.trim() : undefined;

    console.log(`[FORCE UPDATE PASSWORD] Updating password for:`, {
      email: emailN,
      username: usernameN,
      userId: userIdN,
    });

    // Connect to database
    await connectToDatabase();
    console.log("[FORCE UPDATE PASSWORD] Database connected");

    // Find user by strongest identifier first
    let user = null;
    if (userIdN) {
      user = await User.findOne({ userId: userIdN });
    }
    if (!user && emailN) {
      user = await User.findOne({ email: emailN });
    }
    if (!user && usernameN) {
      user = await User.findOne({ username: usernameN });
    }

    // Fallback: tolerate stray whitespace/casing stored in DB
    if (!user && (emailN || usernameN)) {
      const escape = (v) => v.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const ors = [];
      if (emailN) {
        ors.push({ email: new RegExp(`^${escape(emailN)}\\s*$`, "i") });
      }
      if (usernameN) {
        ors.push({ username: new RegExp(`^${escape(usernameN)}\\s*$`, "i") });
      }
      if (ors.length) {
        user = await User.findOne({ $or: ors });
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    console.log(`[FORCE UPDATE PASSWORD] Found user:`, {
      userId: user.userId,
      email: user.email,
      username: user.username,
    });

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Normalize stored identifiers to prevent future mismatches
    const safeEmail =
      typeof user.email === "string"
        ? user.email.trim().toLowerCase()
        : user.email;
    const safeUsername =
      typeof user.username === "string"
        ? user.username.trim().toLowerCase()
        : user.username;

    // Update user password, clear tokens, and normalize fields
    user.email = safeEmail;
    user.username = safeUsername;
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
        id: user.userId,
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
