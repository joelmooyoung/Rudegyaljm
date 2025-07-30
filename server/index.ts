import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// MongoDB connection
let isConnected = false;
async function connectToDatabase() {
  if (isConnected) return;

  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rude-gyal-confessions";
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: "rude-gyal-confessions",
    });
    isConnected = true;
    console.log("[MongoDB] Connected successfully");
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    throw error;
  }
}

// User schema
const userSchema = new mongoose.Schema({
  userId: String,
  username: String,
  email: String,
  password: String,
  type: String,
  active: Boolean,
  loginCount: Number,
  lastLogin: Date,
  createdAt: Date
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Story schema
const storySchema = new mongoose.Schema({
  storyId: String,
  title: String,
  content: String,
  excerpt: String,
  author: String,
  category: String,
  tags: [String],
  accessLevel: String,
  published: Boolean,
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date,
  viewCount: Number,
  rating: Number,
  ratingCount: Number,
  image: String
});

const Story = mongoose.models.Story || mongoose.model('Story', storySchema);

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Basic API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server!" });
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Simple test endpoint
  app.get("/api/test", (_req, res) => {
    res.json({
      message: "Test endpoint working",
      env: process.env.NODE_ENV || "development",
    });
  });

  // REAL DATABASE LOGIN
  app.post("/api/auth/login", async (req, res) => {
    console.log("[LOGIN] Attempting login with real database");

    try {
      await connectToDatabase();
      console.log("[LOGIN] Database connected successfully");

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required"
        });
      }

      console.log(`[LOGIN] Looking for user: ${email}`);
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        console.log("[LOGIN] User not found");
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      console.log(`[LOGIN] User found: ${user.username}, active: ${user.active}`);

      if (!user.active) {
        return res.status(401).json({
          success: false,
          message: "Account is inactive"
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log(`[LOGIN] Password valid: ${isValidPassword}`);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      // Update login stats
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();

      const token = `token_${user.userId}_${Date.now()}`;

      console.log("[LOGIN] Login successful, returning user data");

      res.json({
        success: true,
        message: "Login successful",
        token: token,
        user: {
          id: user.userId,
          email: user.email,
          username: user.username,
          role: user.type,
          isActive: user.active,
          isAgeVerified: true,
          subscriptionStatus: user.type === "premium" ? "active" : "none",
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        }
      });

    } catch (error) {
      console.error("[LOGIN] Database connection failed:", error.message);
      res.status(500).json({
        success: false,
        message: "Database connection failed. Please try again."
      });
    }
  });

  // Import and set up API routes for development
  // In development, we need to manually import the API handlers
  app.use("/api", async (req, res, next) => {
    try {
      // Try to dynamically import the API handler based on the path
      const pathSegments = req.path.split('/').filter(Boolean);

      if (pathSegments.length === 0) {
        return next();
      }

      let modulePath;
      if (pathSegments.length === 1) {
        // Single level: /api/stories -> ../api/stories.js
        modulePath = `../api/${pathSegments[0]}.js`;
      } else if (pathSegments.length === 2) {
        // Two levels: /api/auth/login -> ../api/auth/login.js
        modulePath = `../api/${pathSegments[0]}/${pathSegments[1]}.js`;
      } else {
        return next();
      }

      const { default: handler } = await import(modulePath);
      return handler(req, res);
    } catch (error) {
      console.log(`No handler found for ${req.path}, continuing to next middleware`);
      next();
    }
  });

  return app;
}
