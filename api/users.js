// Users management API with MongoDB integration
import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";
import bcrypt from "bcryptjs";

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

        // Transform to expected format (map database fields to frontend fields)
        const transformedUsers = users.map((user) => ({
          id: user.userId,
          username: user.username,
          email: user.email,
          role: user.type, // Map type to role
          isActive: user.active, // Map active to isActive
          country: user.country,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount,
          createdAt: user.createdAt, // Use createdAt instead of joinedAt
          subscriptionStatus: user.type === "premium" ? "active" : "none",
        }));

        console.log(`[USERS API] Found ${transformedUsers.length} users`);
        return res.status(200).json({
          success: true,
          data: transformedUsers,
          count: transformedUsers.length,
        });

      case "POST":
        console.log(`[USERS API] Creating new user`);

        // Map frontend fields to backend fields
        const {
          username,
          email,
          password,
          role = "free", // Frontend sends 'role'
          isActive = true, // Frontend sends 'isActive'
          country = "Unknown",
        } = req.body;

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

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const userId = Date.now().toString();
        const newUser = new User({
          userId,
          username,
          email,
          password: hashedPassword, // Store hashed password
          type: role, // Map role to type for database
          active: isActive, // Map isActive to active for database
          country,
          loginCount: 0,
        });

        await newUser.save();
        console.log(`[USERS API] ✅ Created user: ${username}`);

        // Return transformed data
        return res.status(201).json({
          success: true,
          message: "User created successfully",
          data: {
            id: newUser.userId,
            username: newUser.username,
            email: newUser.email,
            role: newUser.type, // Map back to frontend format
            isActive: newUser.active, // Map back to frontend format
            country: newUser.country,
            createdAt: newUser.createdAt,
            subscriptionStatus: newUser.type === "premium" ? "active" : "none",
          },
        });

            case "PUT":
        console.log(`[USERS API] Updating user`);
        console.log(`[USERS API] Request body keys:`, Object.keys(req.body));
        console.log(`[USERS API] Request body id field:`, req.body.id);
        const { id: updateId } = req.body;

        if (!updateId) {
          console.log(`[USERS API] ❌ No user ID provided in request body`);
          return res.status(400).json({
            success: false,
            message: "User ID is required",
          });
        }

        console.log(`[USERS API] Updating user with ID: ${updateId}`);

        const userToUpdate = await User.findOne({ userId: updateId });
        if (!userToUpdate) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        // Update fields with proper field mapping
        const updateFields = {};
        if (req.body.username) updateFields.username = req.body.username;
        if (req.body.email) updateFields.email = req.body.email;
        if (req.body.role) updateFields.type = req.body.role; // Map role to type
        if (req.body.hasOwnProperty("isActive"))
          updateFields.active = req.body.isActive; // Map isActive to active
        if (req.body.country) updateFields.country = req.body.country;

        // Hash password if provided
        if (req.body.password) {
          const saltRounds = 12;
          updateFields.password = await bcrypt.hash(
            req.body.password,
            saltRounds,
          );
        }

        const updatedUser = await User.findOneAndUpdate(
          { userId: updateId },
          updateFields,
          { new: true },
        ).select("-password");

        console.log(`[USERS API] ✅ Updated user ${updateId}`);

        // Return transformed data
        return res.status(200).json({
          success: true,
          message: "User updated successfully",
          data: {
            id: updatedUser.userId,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.type, // Map back to frontend format
            isActive: updatedUser.active, // Map back to frontend format
            country: updatedUser.country,
            createdAt: updatedUser.createdAt,
            subscriptionStatus:
              updatedUser.type === "premium" ? "active" : "none",
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
