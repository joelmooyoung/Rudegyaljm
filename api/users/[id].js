import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { id: userId } = req.query;

  console.log(`[USER API] ${req.method} /api/users/${userId}`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    if (req.method === "GET") {
      // Get single user
      const user = await User.findOne({ userId }).select("-password -__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Transform to expected format
      const transformedUser = {
        id: user.userId,
        username: user.username,
        email: user.email,
        role: user.type, // Map type to role
        isActive: user.active, // Map active to isActive
        country: user.country,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        createdAt: user.createdAt,
        subscriptionStatus: user.type === "premium" ? "active" : "none",
      };

      return res.status(200).json({
        success: true,
        data: transformedUser,
      });
    }

    if (req.method === "PUT") {
      console.log(`[USER API] Updating user: ${userId}`);
      console.log(`[USER API] Request body:`, req.body);

      // Find the user
      const existingUser = await User.findOne({ userId });
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update fields from request body
      const updateFields = {};
      const allowedFields = [
        "username",
        "email",
        "password",
        "role",
        "isActive",
        "country",
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (field === "role") {
            // Map role to type for database
            updateFields.type = req.body[field];
          } else if (field === "isActive") {
            // Map isActive to active for database
            updateFields.active = req.body[field];
          } else if (field === "password" && req.body[field]) {
            // Hash password if provided
            const saltRounds = 12;
            updateFields.password = await bcrypt.hash(
              req.body[field],
              saltRounds,
            );
          } else {
            updateFields[field] = req.body[field];
          }
        }
      }

      console.log(`[USER API] Updating fields:`, updateFields);

      // Update the user
      const updatedUser = await User.findOneAndUpdate(
        { userId },
        updateFields,
        { new: true },
      ).select("-password -__v");

      console.log(`[USER API] ✅ Updated user: ${userId}`);

      // Transform response
      const transformedUser = {
        id: updatedUser.userId,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.type,
        isActive: updatedUser.active,
        country: updatedUser.country,
        lastLogin: updatedUser.lastLogin,
        loginCount: updatedUser.loginCount,
        createdAt: updatedUser.createdAt,
        subscriptionStatus: updatedUser.type === "premium" ? "active" : "none",
      };

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: transformedUser,
      });
    }

    if (req.method === "DELETE") {
      const deletedUser = await User.findOneAndDelete({ userId });

      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      console.log(`[USER API] ✅ Deleted user: ${userId}`);

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error(`[USER API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
