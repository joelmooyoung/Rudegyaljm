import crypto from "crypto";
import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";
import { Resend } from "resend";

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    console.log(`[FORGOT PASSWORD API] Reset request for: ${email}`);

    let user = null;
    let userSource = "unknown";

    // Try database first, then fallback to local users
    try {
      await connectToDatabase();
      user = await User.findOne({ email });
      userSource = "database";
      console.log(`[FORGOT PASSWORD API] Found user in database: ${email}`);
    } catch (dbError) {
      console.log(
        `[FORGOT PASSWORD API] Database failed, trying local users: ${dbError.message}`,
      );

      try {
        const { getUserByEmail, initializeLocalUsers } = await import(
          "../../lib/local-users.js"
        );
        await initializeLocalUsers();
        user = await getUserByEmail(email);
        userSource = "local";
        console.log(
          `[FORGOT PASSWORD API] Found user in local storage: ${email}`,
        );
      } catch (localError) {
        console.error(
          `[FORGOT PASSWORD API] Local user lookup failed: ${localError.message}`,
        );
      }
    }

    // Always return success to prevent email enumeration attacks
    // But only generate token if user exists
    if (user) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      console.log(
        `[FORGOT PASSWORD API] Generated reset token for ${email} (${userSource})`,
      );

      // For local users, we'll simulate token storage
      // In production, you'd want to store this securely
      if (userSource === "database") {
        // Save reset token to database user
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();
      } else {
        // For local users, just log the token (in production, store in secure temp storage)
        console.log(
          `[FORGOT PASSWORD API] Local user reset token (would be stored securely): ${resetToken}`,
        );
      }

      // Send password reset email using Resend
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        // Generate proper reset URL based on current environment
        const baseUrl =
          process.env.FRONTEND_URL ||
          "https://828ad77a3e9d40c7be6deab3e340d51f-4bd5d56465ea4c69a7b89487f.fly.dev";
        const resetUrl = `${baseUrl}/?reset-password=true&token=${resetToken}`;

        const emailResult = await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL || "noreply@rudegyalconfessions.com",
          to: user.email,
          subject: "Password Reset - Rude Gyal Confessions",
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
              <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Password Reset</h1>
                <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Rude Gyal Confessions</p>
              </div>

              <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #374151; margin-bottom: 20px;">Reset Your Password</h2>

                <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  We received a request to reset your password for your Rude Gyal Confessions account.
                  Click the button below to create a new password.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}"
                     style="background: linear-gradient(135deg, #ec4899, #8b5cf6);
                            color: white;
                            text-decoration: none;
                            padding: 15px 30px;
                            border-radius: 8px;
                            font-weight: bold;
                            font-size: 16px;
                            display: inline-block;">
                    Reset My Password
                  </a>
                </div>

                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 25px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    ⚠️ <strong>Important:</strong> This link will expire in 15 minutes for security reasons.
                  </p>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="color: #3b82f6; font-size: 14px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
                  ${resetUrl}
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                  If you didn't request this password reset, please ignore this email.
                  Your password will remain unchanged.
                </p>

                <p style="color: #9ca3af; font-size: 13px; margin: 15px 0 0 0;">
                  Best regards,<br>
                  The Rude Gyal Confessions Team
                </p>
              </div>
            </div>
          `,
        });

        console.log(
          `[FORGOT PASSWORD API] ✅ Email sent successfully to ${email}:`,
          emailResult.data?.id,
        );
      } catch (emailError) {
        console.error(
          `[FORGOT PASSWORD API] ❌ Email sending failed:`,
          emailError,
        );
        // Don't fail the request if email fails - still generate token for security
      }

      // For development, still log token for testing
      if (process.env.NODE_ENV === "development") {
        console.log(`[FORGOT PASSWORD API] Reset token: ${resetToken}`);
      }
    } else {
      console.log(
        `[FORGOT PASSWORD API] User not found: ${email} (still returning success)`,
      );
    }

    // Always return success message for security
    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
      userSource: userSource,
      // Remove this in production - for testing only
      ...(process.env.NODE_ENV === "development" &&
        user && {
          resetToken:
            user.resetToken || "generated-but-not-stored-for-local-users",
          resetUrl: `/reset-password?token=${user.resetToken || "test-token"}`,
        }),
    });
  } catch (error) {
    console.error("[FORGOT PASSWORD API] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
