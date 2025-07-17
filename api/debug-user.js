import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    // Find the admin user
    const user = await User.findOne({ email: "admin@nocturne.com" });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
        totalUsers: await User.countDocuments(),
        allUsers: await User.find({}, { email: 1, username: 1, type: 1 }),
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        type: user.type,
        passwordHash: user.password.substring(0, 20) + "...", // Show partial hash
        passwordLength: user.password.length,
        active: user.active,
        loginCount: user.loginCount,
      },
      totalUsers: await User.countDocuments(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
