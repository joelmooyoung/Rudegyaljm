import { connectToDatabase } from "../../../lib/mongodb.js";
import { User } from "../../../models/index.js";

export default async function handler(req, res) {
  const { id: userId } = req.query;

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Toggle the active status
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { active: !user.active },
      { new: true },
    ).select("-password -__v");

    // Transform to expected format
    const transformedUser = {
      id: updatedUser.userId,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.type, // Map type to role
      isActive: updatedUser.active, // Map active to isActive
      country: updatedUser.country,
      lastLogin: updatedUser.lastLogin,
      loginCount: updatedUser.loginCount,
      createdAt: updatedUser.createdAt,
      subscriptionStatus: updatedUser.type === "premium" ? "active" : "none",
    };

    return res.status(200).json(transformedUser);
  } catch (error) {
    console.error("Toggle user active error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
