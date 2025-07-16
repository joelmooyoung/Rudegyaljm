import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { User, UserCreateRequest, UserUpdateRequest } from "@shared/api";
import { UserModel, ErrorLogModel, toUserResponse } from "../models";

// Helper function to log errors to MongoDB
const logError = async (
  error: string,
  req: any,
  severity: "low" | "medium" | "high" | "critical" = "medium",
): Promise<void> => {
  try {
    const errorLog = new ErrorLogModel({
      error,
      endpoint: req.originalUrl,
      method: req.method,
      ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
      userAgent: req.get("User-Agent") || "unknown",
      severity,
    });

    await errorLog.save();
    console.error(
      `[${severity.toUpperCase()}] ${req.method} ${req.originalUrl}: ${error}`,
    );
  } catch (logErr) {
    console.error("Failed to log error to database:", logErr);
  }
};

// GET /api/users - Get all users (admin only)
export const getUsers: RequestHandler = async (req, res) => {
  try {
    // In a real app, verify admin role from JWT token
    const users = await UserModel.find().sort({ createdAt: -1 });

    console.log(`[DEBUG] Total users in database: ${users.length}`);

    const response = users.map(toUserResponse);
    console.log(`[DEBUG] Returning ${response.length} users`);
    res.json(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch users";
    await logError(`Error fetching users: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/users/:id - Get single user (admin only)
export const getUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);

    if (!user) {
      await logError(`User not found: ${id}`, req, "medium");
      return res.status(404).json({ message: "User not found" });
    }

    res.json(toUserResponse(user));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch user";
    await logError(`Error fetching user: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/users - Create new user (admin only)
export const createUser: RequestHandler = async (req, res) => {
  try {
    const userData: UserCreateRequest = req.body;

    // Validate required fields
    if (!userData.email || !userData.username || !userData.password) {
      await logError(
        "Missing required fields for user creation",
        req,
        "medium",
      );
      return res
        .status(400)
        .json({ message: "Email, username, and password are required" });
    }

    // Check if email already exists
    const existingUser = await UserModel.findOne({
      $or: [
        { email: userData.email.toLowerCase() },
        { username: userData.username.toLowerCase() },
      ],
    });

    if (existingUser) {
      const message =
        existingUser.email === userData.email.toLowerCase()
          ? "Email already exists"
          : "Username already exists";
      return res.status(400).json({ message });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // Create new user
    const newUser = new UserModel({
      email: userData.email.toLowerCase(),
      username: userData.username.toLowerCase(),
      password: passwordHash,
      role: userData.role || "free",
      isAgeVerified: userData.isAgeVerified || false,
      isActive: true,
      subscriptionStatus: "none",
    });

    const savedUser = await newUser.save();

    console.log(`[DEBUG] User created with ID: ${savedUser._id}`);
    console.log(`[DEBUG] New user:`, {
      id: savedUser._id.toString(),
      email: savedUser.email,
      username: savedUser.username,
      role: savedUser.role,
    });

    res.status(201).json(toUserResponse(savedUser));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create user";
    await logError(`Error creating user: ${errorMessage}`, req, "critical");
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/users/:id - Update user (admin only)
export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userData: UserUpdateRequest = req.body;

    const user = await UserModel.findById(id);
    if (!user) {
      await logError(`User not found for update: ${id}`, req, "medium");
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email already exists (if changing email)
    if (userData.email && userData.email !== user.email) {
      const existingUser = await UserModel.findOne({
        email: userData.email.toLowerCase(),
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Check if username already exists (if changing username)
    if (userData.username && userData.username !== user.username) {
      const existingUsername = await UserModel.findOne({
        username: userData.username.toLowerCase(),
      });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Hash new password if provided
    if (userData.password) {
      const saltRounds = 12;
      user.password = await bcrypt.hash(userData.password, saltRounds);
    }

    // Update other fields
    if (userData.email) user.email = userData.email.toLowerCase();
    if (userData.username) user.username = userData.username.toLowerCase();
    if (userData.role) user.role = userData.role;
    if (userData.isActive !== undefined) user.isActive = userData.isActive;
    if (userData.subscriptionStatus)
      user.subscriptionStatus = userData.subscriptionStatus;
    if (userData.subscriptionExpiry)
      user.subscriptionExpiry = userData.subscriptionExpiry;

    const updatedUser = await user.save();
    res.json(toUserResponse(updatedUser));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update user";
    await logError(`Error updating user: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/users/:id - Delete user (admin only)
export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);

    if (!user) {
      await logError(`User not found for deletion: ${id}`, req, "medium");
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting the last admin
    if (user.role === "admin") {
      const adminCount = await UserModel.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot delete the last admin user",
        });
      }
    }

    await UserModel.findByIdAndDelete(id);

    res.json({
      message: "User deleted successfully",
      user: toUserResponse(user),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete user";
    await logError(`Error deleting user: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/users/:id/toggle-active - Toggle user active status (admin only)
export const toggleUserActive: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);

    if (!user) {
      await logError(`User not found for status toggle: ${id}`, req, "medium");
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deactivating the last active admin
    if (user.role === "admin" && user.isActive) {
      const activeAdminCount = await UserModel.countDocuments({
        role: "admin",
        isActive: true,
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          message: "Cannot deactivate the last active admin user",
        });
      }
    }

    user.isActive = !user.isActive;
    const updatedUser = await user.save();

    res.json(toUserResponse(updatedUser));
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to toggle user active status";
    await logError(
      `Error toggling user active status: ${errorMessage}`,
      req,
      "high",
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/users/stats - Get user statistics (admin only)
export const getUserStats: RequestHandler = async (req, res) => {
  try {
    const [
      total,
      active,
      inactive,
      admins,
      premium,
      free,
      activeSubscriptions,
      expiredSubscriptions,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ isActive: true }),
      UserModel.countDocuments({ isActive: false }),
      UserModel.countDocuments({ role: "admin" }),
      UserModel.countDocuments({ role: "premium" }),
      UserModel.countDocuments({ role: "free" }),
      UserModel.countDocuments({ subscriptionStatus: "active" }),
      UserModel.countDocuments({ subscriptionStatus: "expired" }),
    ]);

    const stats = {
      total,
      active,
      inactive,
      admins,
      premium,
      free,
      activeSubscriptions,
      expiredSubscriptions,
    };

    res.json(stats);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch user stats";
    await logError(`Error fetching user stats: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};
