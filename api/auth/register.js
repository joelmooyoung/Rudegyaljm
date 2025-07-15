// User registration API with MongoDB integration
import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[REGISTER API] ${req.method} /api/auth/register`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectToDatabase();

    const { username, email, password, type = "free" } = req.body;
    console.log(`[REGISTER API] Registration attempt for: ${email}`);

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
      console.log(`[REGISTER API] ❌ User already exists: ${email}`);
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Create new user
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
    console.log(`[REGISTER API] ✅ Created user: ${username}`);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        userId: newUser.userId,
        username: newUser.username,
        email: newUser.email,
        type: newUser.type,
        country: newUser.country,
        active: newUser.active,
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
