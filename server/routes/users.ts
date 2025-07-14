import { RequestHandler } from "express";
import { User, UserCreateRequest, UserUpdateRequest } from "@shared/api";

// Mock user database (replace with real database in production)
let users: User[] = [
  {
    id: "1",
    email: "admin@nocturne.com",
    username: "admin",
    role: "admin",
    isAgeVerified: true,
    isActive: true,
    subscriptionStatus: "none",
    createdAt: new Date("2024-01-01"),
    lastLogin: new Date("2024-01-15"),
  },
  {
    id: "2",
    email: "premium@test.com",
    username: "premiumUser",
    role: "premium",
    isAgeVerified: true,
    isActive: true,
    subscriptionStatus: "active",
    subscriptionExpiry: new Date("2024-12-31"),
    createdAt: new Date("2024-01-05"),
    lastLogin: new Date("2024-01-14"),
  },
  {
    id: "3",
    email: "free@test.com",
    username: "freeUser",
    role: "free",
    isAgeVerified: true,
    isActive: true,
    subscriptionStatus: "none",
    createdAt: new Date("2024-01-10"),
    lastLogin: new Date("2024-01-13"),
  },
  {
    id: "4",
    email: "jane.doe@example.com",
    username: "janeDoe",
    role: "free",
    isAgeVerified: true,
    isActive: false,
    subscriptionStatus: "none",
    createdAt: new Date("2024-01-08"),
    lastLogin: new Date("2024-01-12"),
  },
  {
    id: "5",
    email: "john.smith@example.com",
    username: "johnSmith",
    role: "premium",
    isAgeVerified: true,
    isActive: true,
    subscriptionStatus: "expired",
    subscriptionExpiry: new Date("2023-12-31"),
    createdAt: new Date("2023-11-15"),
    lastLogin: new Date("2024-01-11"),
  },
];

// Helper function to log errors
const logError = (
  error: string,
  req: any,
  severity: "low" | "medium" | "high" | "critical" = "medium",
): void => {
  console.error(
    `[${severity.toUpperCase()}] ${req.method} ${req.originalUrl}: ${error}`,
  );
};

// GET /api/users - Get all users (admin only)
export const getUsers: RequestHandler = (req, res) => {
  try {
    // In a real app, verify admin role from JWT token
    console.log(`[DEBUG] Total users in database: ${users.length}`);

    // Sort by creation date (newest first)
    const sortedUsers = [...users].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    console.log(`[DEBUG] Returning ${sortedUsers.length} users`);
    res.json(sortedUsers);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch users";
    logError(`Error fetching users: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/users/:id - Get single user (admin only)
export const getUser: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const user = users.find((u) => u.id === id);

    if (!user) {
      logError(`User not found: ${id}`, req, "medium");
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch user";
    logError(`Error fetching user: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/users - Create new user (admin only)
export const createUser: RequestHandler = (req, res) => {
  try {
    const userData: UserCreateRequest = req.body;

    // Validate required fields
    if (!userData.email || !userData.username || !userData.password) {
      logError("Missing required fields for user creation", req, "medium");
      return res
        .status(400)
        .json({ message: "Email, username, and password are required" });
    }

    // Check if email already exists
    const existingUser = users.find((u) => u.email === userData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if username already exists
    const existingUsername = users.find(
      (u) => u.username === userData.username,
    );
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      username: userData.username,
      role: userData.role || "free",
      isAgeVerified: userData.isAgeVerified || false,
      isActive: true,
      subscriptionStatus: "none",
      createdAt: new Date(),
    };

    users.push(newUser);
    console.log(`[DEBUG] User created. Total users now: ${users.length}`);
    console.log(`[DEBUG] New user:`, {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    });

    // Don't return password in response
    res.status(201).json(newUser);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create user";
    logError(`Error creating user: ${errorMessage}`, req, "critical");
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/users/:id - Update user (admin only)
export const updateUser: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const userData: UserUpdateRequest = req.body;

    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      logError(`User not found for update: ${id}`, req, "medium");
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email already exists (if changing email)
    if (userData.email && userData.email !== users[userIndex].email) {
      const existingUser = users.find((u) => u.email === userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Check if username already exists (if changing username)
    if (userData.username && userData.username !== users[userIndex].username) {
      const existingUsername = users.find(
        (u) => u.username === userData.username,
      );
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Update user while preserving creation date and ID
    const updatedUser: User = {
      ...users[userIndex],
      ...userData,
      id: users[userIndex].id, // Preserve original ID
      createdAt: users[userIndex].createdAt, // Preserve creation date
    };

    users[userIndex] = updatedUser;

    res.json(updatedUser);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update user";
    logError(`Error updating user: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/users/:id - Delete user (admin only)
export const deleteUser: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      logError(`User not found for deletion: ${id}`, req, "medium");
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting the last admin
    const user = users[userIndex];
    if (user.role === "admin") {
      const adminCount = users.filter((u) => u.role === "admin").length;
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot delete the last admin user",
        });
      }
    }

    const deletedUser = users.splice(userIndex, 1)[0];

    res.json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete user";
    logError(`Error deleting user: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/users/:id/toggle-active - Toggle user active status (admin only)
export const toggleUserActive: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      logError(`User not found for status toggle: ${id}`, req, "medium");
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deactivating the last active admin
    const user = users[userIndex];
    if (user.role === "admin" && user.isActive) {
      const activeAdminCount = users.filter(
        (u) => u.role === "admin" && u.isActive,
      ).length;
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          message: "Cannot deactivate the last active admin user",
        });
      }
    }

    users[userIndex].isActive = !users[userIndex].isActive;

    res.json(users[userIndex]);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to toggle user active status";
    logError(`Error toggling user active status: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/users/stats - Get user statistics (admin only)
export const getUserStats: RequestHandler = (req, res) => {
  try {
    const stats = {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length,
      admins: users.filter((u) => u.role === "admin").length,
      premium: users.filter((u) => u.role === "premium").length,
      free: users.filter((u) => u.role === "free").length,
      activeSubscriptions: users.filter(
        (u) => u.subscriptionStatus === "active",
      ).length,
      expiredSubscriptions: users.filter(
        (u) => u.subscriptionStatus === "expired",
      ).length,
    };

    res.json(stats);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch user stats";
    logError(`Error fetching user stats: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};
