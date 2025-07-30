import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Resend } from "resend";

// MongoDB connection with retry logic
let isConnected = false;
let connectionPromise = null;

async function connectToDatabase() {
  if (isConnected) return;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      const MONGODB_URI =
        process.env.MONGODB_URI ||
        "mongodb://localhost:27017/rude-gyal-confessions";

      console.log("[MongoDB] Attempting connection...");

      await mongoose.connect(MONGODB_URI, {
        bufferCommands: true, // Enable buffering temporarily
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        socketTimeoutMS: 45000,
        dbName: "rude-gyal-confessions",
      });

      // Wait for connection to be ready
      await mongoose.connection.db.admin().ping();

      isConnected = true;
      console.log(
        "[MongoDB] Connected successfully to:",
        mongoose.connection.db.databaseName,
      );
    } catch (error) {
      console.error("[MongoDB] Connection failed:", error.message);
      isConnected = false;
      connectionPromise = null;
      throw new Error("Database connection failed");
    }
  })();

  return connectionPromise;
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
  createdAt: Date,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

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
  image: String,
});

const Story = mongoose.models.Story || mongoose.model("Story", storySchema);

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

  // Email endpoint health check
  app.get("/api/test-email", (req, res) => {
    console.log("🔍 [EMAIL TEST] GET request to /api/test-email");
    res.json({
      message: "Email test endpoint is available",
      method: "POST required",
      hasResendKey: !!process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || "not set",
    });
  });

  // CREATE ADMIN USER ENDPOINT
  app.post("/api/create-admin", async (req, res) => {
    console.log("👑 [CREATE ADMIN] Creating admin user...");

    try {
      await connectToDatabase();
      console.log("👑 [CREATE ADMIN] Database connected");

      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: "admin@rudegyalconfessions.com" });

      if (existingAdmin) {
        console.log("👑 [CREATE ADMIN] Admin already exists");
        return res.json({
          success: true,
          message: "Admin user already exists",
          credentials: {
            email: "admin@rudegyalconfessions.com",
            password: "admin123"
          }
        });
      }

      // Create new admin user
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash("admin123", saltRounds);

      const adminUser = new User({
        userId: "admin_" + Date.now(),
        username: "admin",
        email: "admin@rudegyalconfessions.com",
        password: hashedPassword,
        type: "admin",
        country: "Unknown",
        active: true,
        loginCount: 0,
        createdAt: new Date()
      });

      await adminUser.save();

      console.log("👑 [CREATE ADMIN] ✅ Admin user created successfully");

      res.json({
        success: true,
        message: "Admin user created successfully!",
        credentials: {
          email: "admin@rudegyalconfessions.com",
          password: "admin123"
        },
        user: {
          email: adminUser.email,
          username: adminUser.username,
          role: adminUser.type
        }
      });

    } catch (error) {
      console.error("👑 [CREATE ADMIN] ❌ Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create admin user",
        error: error.message
      });
    }
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
          message: "Email and password are required",
        });
      }

      console.log(`[LOGIN] Looking for user: ${email}`);
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        console.log("[LOGIN] User not found");
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      console.log(
        `[LOGIN] User found: ${user.username}, active: ${user.active}`,
      );

      if (!user.active) {
        return res.status(401).json({
          success: false,
          message: "Account is inactive",
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log(`[LOGIN] Password valid: ${isValidPassword}`);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
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
        },
      });
    } catch (error) {
      console.error("[LOGIN] Database connection failed:", error.message);
      res.status(500).json({
        success: false,
        message: "Database connection failed. Please try again.",
      });
    }
  });

  // REAL STORIES ENDPOINT
  app.get("/api/stories", async (req, res) => {
    console.log("[STORIES] Fetching stories from real database");

    try {
      await connectToDatabase();
      console.log("[STORIES] Database connected successfully");

      const stories = await Story.find({ published: true })
        .sort({ createdAt: -1 })
        .lean();

      console.log(`[STORIES] Found ${stories.length} published stories`);

      // Transform for frontend
      const transformedStories = stories.map((story) => ({
        id: story.storyId || story._id.toString(),
        title: story.title || "Untitled",
        content: story.content || "",
        excerpt: story.excerpt || "",
        author: story.author || "Unknown Author",
        category: story.category || "Romance",
        tags: Array.isArray(story.tags) ? story.tags : [],
        accessLevel: story.accessLevel || "free",
        isPublished: story.published || false,
        publishedAt: story.publishedAt || story.createdAt,
        createdAt: story.createdAt || new Date(),
        updatedAt: story.updatedAt || new Date(),
        viewCount: story.viewCount || 0,
        rating: story.rating || 0,
        ratingCount: story.ratingCount || 0,
        image: story.image || null,
      }));

      res.json(transformedStories);
    } catch (error) {
      console.error("[STORIES] Database error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to load stories from database",
      });
    }
  });

  // WORKING EMAIL TEST ENDPOINT
  app.post("/api/test-email", async (req, res) => {
    console.log("🚀 [EMAIL TEST] ==========================================");
    console.log("🚀 [EMAIL TEST] Test email request received!");
    console.log("🚀 [EMAIL TEST] Method:", req.method);
    console.log("🚀 [EMAIL TEST] Headers:", req.headers);
    console.log("🚀 [EMAIL TEST] Body:", req.body);

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // Check Resend configuration
      const resendKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL;

      if (!resendKey) {
        console.error("[EMAIL TEST] RESEND_API_KEY not found");
        return res.status(500).json({
          success: false,
          message: "Resend API key not configured",
        });
      }

      console.log(`[EMAIL TEST] Sending test email to: ${email}`);
      console.log(`[EMAIL TEST] From email: ${fromEmail}`);
      console.log(`[EMAIL TEST] API key present: ${!!resendKey}`);

      const resend = new Resend(resendKey);

      const emailResult = await resend.emails.send({
        from: fromEmail || "noreply@rudegyalconfessions.com",
        to: email,
        subject: "✅ Test Email - Rude Gyal Confessions",
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
            <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Email Test Successful!</h1>
              <p style="color: #fce7f3; margin: 10px 0 0 0;">Rude Gyal Confessions</p>
            </div>

            <div style="background: white; padding: 40px;">
              <h2 style="color: #374151; margin-bottom: 20px;">🎉 Great News!</h2>

              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Your Resend email integration is working perfectly! This test email confirms that:
              </p>

              <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 6px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #166534; font-size: 14px;">
                  ✅ <strong>Email service is fully operational</strong>
                </p>
              </div>

              <ul style="color: #6b7280; font-size: 14px; margin: 20px 0;">
                <li>✅ Resend API connection established</li>
                <li>✅ Email delivery confirmed</li>
                <li>✅ Template rendering correctly</li>
                <li>✅ Ready for production use</li>
              </ul>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                Test sent: ${new Date().toLocaleString()}<br>
                From: ${fromEmail || "noreply@rudegyalconfessions.com"}
              </p>
            </div>
          </div>
        `,
      });

      console.log(
        `[EMAIL TEST] ✅ Email sent successfully! ID: ${emailResult.data?.id}`,
      );

      res.json({
        success: true,
        message: "Test email sent successfully!",
        emailId: emailResult.data?.id,
        to: email,
        from: fromEmail,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[EMAIL TEST] ❌ Error sending email:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send test email",
        error: error.message,
      });
    }
  });

  // Import and set up API routes for development
  // In development, we need to manually import the API handlers
  app.use("/api", async (req, res, next) => {
    try {
      // Try to dynamically import the API handler based on the path
      const pathSegments = req.path.split("/").filter(Boolean);

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
      console.log(
        `No handler found for ${req.path}, continuing to next middleware`,
      );
      next();
    }
  });

  return app;
}
