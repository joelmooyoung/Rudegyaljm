import bcrypt from "bcryptjs";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";
import { triggerUserCacheInvalidation } from "../../lib/cache-manager.js";

export default async function handler(req, res) {
  console.log(`[REGISTER API] ${req.method} /api/auth/register`);

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
    await connectToDatabase();

    const { username, email, password, dateOfBirth } = req.body;
    console.log(`[REGISTER API] Registration attempt for: ${email}`);

    // All new users are assigned 'free' role by default - admin privileges must be granted by existing admin
    const role = "free";

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Validate age (must be 18+)
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (age < 18 || (age === 18 && monthDiff < 0)) {
        return res.status(400).json({
          success: false,
          message: "You must be at least 18 years old to register",
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      console.log(`[REGISTER API] ❌ User already exists: ${email}`);
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const userId = Date.now().toString();
    const newUser = new User({
      userId,
      username,
      email,
      password: hashedPassword,
      type: role, // Map role to type for database
      country: "Unknown",
      active: true,
      loginCount: 0,
    });

    await newUser.save();
    console.log(`[REGISTER API] ✅ Created user: ${username}`);

    // Invalidate user and stats caches
    await triggerUserCacheInvalidation();
    console.log(
      `[REGISTER API] 🗑️ Cache invalidated for new user registration`,
    );

    // Generate simple token (in production, use JWT)
    const token = `auth_${newUser.userId}_${Date.now()}`;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: token,
      user: {
        id: newUser.userId,
        email: newUser.email,
        username: newUser.username,
        role: newUser.type, // Map type back to role for frontend
        isActive: newUser.active,
        isAgeVerified: true,
        subscriptionStatus: newUser.type === "premium" ? "active" : "none",
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error(`[REGISTER API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
