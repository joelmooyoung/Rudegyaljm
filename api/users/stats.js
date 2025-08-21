import { connectToDatabase } from "../../lib/mongodb.js";
import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDatabase();

    // Calculate user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ active: true });
    const inactiveUsers = await User.countDocuments({ active: false });
    const adminUsers = await User.countDocuments({ type: "admin" });
    const premiumUsers = await User.countDocuments({ type: "premium" });
    const freeUsers = await User.countDocuments({ type: "free" });

    const stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      admins: adminUsers,
      premium: premiumUsers,
      free: freeUsers,
      activeSubscriptions: premiumUsers, // Assuming premium users have active subscriptions
      expiredSubscriptions: 0, // Could be calculated based on subscription expiry dates
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error("User stats error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
