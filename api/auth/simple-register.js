import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  const { email, password, username } = req.body;

  // Basic validation
  if (!email || !password || !username) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and username are required"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters"
    });
  }

  try {
    // Connect to database
    await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email or username already exists"
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      userId: `user_${Date.now()}`,
      username: username,
      email: email.toLowerCase(),
      password: hashedPassword,
      type: "free", // All new users start as free
      country: "Unknown",
      active: true,
      loginCount: 0,
      createdAt: new Date()
    });

    await newUser.save();

    // Generate token for immediate login
    const token = `token_${newUser.userId}_${Date.now()}`;

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: token,
      user: {
        id: newUser.userId,
        email: newUser.email,
        username: newUser.username,
        role: newUser.type,
        isActive: newUser.active
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
