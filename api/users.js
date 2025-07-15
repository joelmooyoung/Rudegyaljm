// Users management API with MongoDB integration
import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[USERS API] ${req.method} /api/users`);
  console.log(`[USERS API] Body:`, req.body);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    switch (req.method) {
      case "GET":
        console.log(`[USERS API] Fetching all users`);

        const users = await User.find({})
          .sort({ createdAt: -1 })
          .select("-password -__v");

        // Transform to expected format
        const transformedUsers = users.map((user) => ({
          id: user.userId,
          username: user.username,
          email: user.email,
          type: user.type,
          country: user.country,
          active: user.active,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount,
          joinedAt: user.createdAt,
        }));

        console.log(`[USERS API] Found ${transformedUsers.length} users`);
        return res.status(200).json({
          success: true,
          data: transformedUsers,
          count: transformedUsers.length,
        });

      case "POST":
        console.log(`[USERS API] Creating new user`);
        const { username, email, password, type = "free" } = req.body;

        if (!username || !email || !password) {
          return res.status(400).json({
            success: false,
            message: "Username, email and password are required",
          });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [{ email }, { username }],
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "User with this email or username already exists",
          });
        }

        const userId = Date.now().toString();
        const newUser = new User({
          userId,
          username,
          email,
          password,
          type,
          country: "Unknown",
          active: true,
          loginCount: 0,
        });

        await newUser.save();
        console.log(`[USERS API] ✅ Created user: ${username}`);

        return res.status(201).json({
          success: true,
          message: "User created successfully",
          data: {
            id: newUser.userId,
            username: newUser.username,
            email: newUser.email,
            type: newUser.type,
            active: newUser.active,
          },
        });

      case "PUT":
        console.log(`[USERS API] Updating user`);
        const { id: updateId } = req.body;

        if (!updateId) {
          return res.status(400).json({
            success: false,
            message: "User ID is required",
          });
        }

        const userToUpdate = await User.findOne({ userId: updateId });
        if (!userToUpdate) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        // Update fields
        const updateFields = {};
        if (req.body.username) updateFields.username = req.body.username;
        if (req.body.email) updateFields.email = req.body.email;
        if (req.body.type) updateFields.type = req.body.type;
        if (req.body.hasOwnProperty("active"))
          updateFields.active = req.body.active;

        const updatedUser = await User.findOneAndUpdate(
          { userId: updateId },
          updateFields,
          { new: true },
        ).select("-password");

        console.log(`[USERS API] ✅ Updated user ${updateId}`);

        return res.status(200).json({
          success: true,
          message: "User updated successfully",
          data: {
            id: updatedUser.userId,
            username: updatedUser.username,
            email: updatedUser.email,
            type: updatedUser.type,
            active: updatedUser.active,
          },
        });

      case "DELETE":
        console.log(`[USERS API] Deleting user`);
        const { id: deleteId } = req.body;

        if (!deleteId) {
          return res.status(400).json({
            success: false,
            message: "User ID is required",
          });
        }

        const deletedUser = await User.findOneAndDelete({ userId: deleteId });
        if (!deletedUser) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        console.log(`[USERS API] ✅ Deleted user ${deleteId}`);

        return res.status(200).json({
          success: true,
          message: "User deleted successfully",
        });

      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[USERS API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
