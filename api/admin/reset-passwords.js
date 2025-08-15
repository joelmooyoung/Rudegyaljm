// Admin endpoint to reset all user passwords to role-based defaults
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[RESET PASSWORDS API] ${req.method} /api/admin/reset-passwords`);

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
    // Try database first
    try {
      console.log("[RESET PASSWORDS API] Connecting to database...");
      await connectToDatabase();
      console.log("[RESET PASSWORDS API] Database connected successfully");

      // Get all users
      const users = await User.find({}).select("userId email type");
      console.log(
        `[RESET PASSWORDS API] Found ${users.length} users to update`,
      );

      const updatedUsers = [];
      const saltRounds = 12;

      // Create default users if database is empty
      const defaultUsers = [
        {
          email: "admin@rudegyalconfessions.com",
          username: "admin",
          type: "admin",
          password: "admin123",
        },
        {
          email: "joelmooyoung@me.com",
          username: "joelmooyoung",
          type: "admin",
          password: "admin123",
        },
      ];

      // Add default users if they don't exist
      for (const defaultUser of defaultUsers) {
        const existingUser = users.find((u) => u.email === defaultUser.email);
        if (!existingUser) {
          console.log(
            `[RESET PASSWORDS API] Creating missing user: ${defaultUser.email}`,
          );

          const hashedPassword = await bcrypt.hash(
            defaultUser.password,
            saltRounds,
          );
          const newUser = new User({
            userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            username: defaultUser.username,
            email: defaultUser.email,
            password: hashedPassword,
            type: defaultUser.type,
            active: true,
            loginCount: 0,
            createdAt: new Date(),
          });

          await newUser.save();
          updatedUsers.push({
            email: defaultUser.email,
            newPassword: defaultUser.password,
            accessLevel: defaultUser.type,
            action: "created",
          });
        }
      }

      // Update existing users with role-based passwords
      for (const user of users) {
        let newPassword;

        switch (user.type) {
          case "admin":
            newPassword = "admin123";
            break;
          case "premium":
            newPassword = "premium123";
            break;
          case "free":
          default:
            newPassword = "free123";
            break;
        }

        console.log(
          `[RESET PASSWORDS API] Updating password for ${user.email} (${user.type}) to ${newPassword}`,
        );

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await User.updateOne(
          { _id: user._id },
          {
            password: hashedPassword,
            active: true, // Ensure user is active
            updatedAt: new Date(),
          },
        );

        updatedUsers.push({
          email: user.email,
          newPassword: newPassword,
          accessLevel: user.type || "free",
          action: "updated",
        });
      }

      console.log(
        `[RESET PASSWORDS API] ✅ Successfully updated ${updatedUsers.length} database users`,
      );

      return res.status(200).json({
        success: true,
        message: `Successfully reset passwords for ${updatedUsers.length} database users`,
        updatedUsers: updatedUsers,
        source: "database",
        passwordRules: {
          admin: "admin123",
          premium: "premium123",
          free: "free123",
        },
      });
    } catch (dbError) {
      console.error(
        "[RESET PASSWORDS API] Database failed, using local users:",
        dbError.message,
      );

      // Fallback to local users
      const { resetAllPasswords, initializeLocalUsers } = await import(
        "../../lib/local-users.js"
      );

      await initializeLocalUsers();
      const updatedUsers = await resetAllPasswords();

      console.log(
        `[RESET PASSWORDS API] ✅ Successfully reset ${updatedUsers.length} local user passwords`,
      );

      return res.status(200).json({
        success: true,
        message: `Successfully reset passwords for ${updatedUsers.length} local users (database unavailable)`,
        updatedUsers: updatedUsers,
        source: "local",
        passwordRules: {
          admin: "admin123",
          premium: "premium123",
          free: "free123",
        },
      });
    }
  } catch (error) {
    console.error("[RESET PASSWORDS API] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset passwords",
      error: error.message,
    });
  }
}
