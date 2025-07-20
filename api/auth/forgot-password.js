import crypto from "crypto";
import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[FORGOT PASSWORD API] ${req.method} /api/auth/forgot-password`);

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
      message: "Method not allowed",
    });
  }

  try {
    await connectToDatabase();

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    console.log(`[FORGOT PASSWORD API] Reset request for: ${email}`);

    // Find user by email
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration attacks
    // But only generate token if user exists
    if (user) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save reset token to user
      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await user.save();

      console.log(`[FORGOT PASSWORD API] Reset token generated for: ${email}`);

      // In a production environment, you would send an email here
      // For now, we'll return the token for testing purposes
      // TODO: Implement email sending service
      console.log(`[FORGOT PASSWORD API] Reset token: ${resetToken}`);
    } else {
      console.log(`[FORGOT PASSWORD API] User not found: ${email} (still returning success)`);
    }

    // Always return success message for security
    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
      // Remove this in production - for testing only
      ...(process.env.NODE_ENV === "development" && user && {
        resetToken: user.resetToken,
        resetUrl: `/reset-password?token=${user.resetToken}`
      })
    });

  } catch (error) {
    console.error("[FORGOT PASSWORD API] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
