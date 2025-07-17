import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    // Find admin user
    const user = await User.findOne({ email: "admin@nocturne.com" });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    // Generate correct bcrypt hash for "admin123"
    const correctPassword = "admin123";
    const saltRounds = 12;
    const correctHash = await bcrypt.hash(correctPassword, saltRounds);

    // Update the user's password
    user.password = correctHash;
    await user.save();

    // Test the fix
    const passwordMatch = await bcrypt.compare(correctPassword, correctHash);

    return res.status(200).json({
      success: true,
      message: "Admin password fixed successfully",
      user: {
        email: user.email,
        username: user.username,
        type: user.type,
      },
      passwordTest: {
        newHash: correctHash.substring(0, 30) + "...",
        testMatch: passwordMatch,
      },
      instruction: "You can now login with admin@nocturne.com / admin123",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
