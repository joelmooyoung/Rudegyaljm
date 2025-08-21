import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Resend } from "resend";
import { getCountryFromIP, getCityFromIP } from "./utils/geolocation.js";
import { User, Story, Comment, LoginLog } from "../models/index.js";

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

// Schemas imported from models/index.js




export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "100mb" })); // Increased for base64 audio files
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

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
    console.log("�� [EMAIL TEST] GET request to /api/test-email");
    res.json({
      message: "Email test endpoint is available",
      method: "POST required",
      hasResendKey: !!process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || "not set",
    });
  });

  // CREATE ADMIN USER ENDPOINT
  app.post("/api/create-admin", async (req, res) => {
    console.log("��� [CREATE ADMIN] Creating admin user...");

    try {
      await connectToDatabase();
      console.log("👑 [CREATE ADMIN] Database connected");

      // Check if admin already exists
      const existingAdmin = await User.findOne({
        email: "admin@rudegyalconfessions.com",
      });

      if (existingAdmin) {
        console.log("👑 [CREATE ADMIN] Admin already exists");
        return res.json({
          success: true,
          message: "Admin user already exists",
          credentials: {
            email: "admin@rudegyalconfessions.com",
            password: "admin123",
          },
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
        createdAt: new Date(),
      });

      await adminUser.save();

      console.log("���� [CREATE ADMIN] ✅ Admin user created successfully");

      res.json({
        success: true,
        message: "Admin user created successfully!",
        credentials: {
          email: "admin@rudegyalconfessions.com",
          password: "admin123",
        },
        user: {
          email: adminUser.email,
          username: adminUser.username,
          role: adminUser.type,
        },
      });
    } catch (error) {
      console.error("👑 [CREATE ADMIN] ❌ Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create admin user",
        error: error.message,
      });
    }
  });

  // RESET ADMIN PASSWORD ENDPOINT
  app.post("/api/reset-admin", async (req, res) => {
    console.log("🔑 [RESET ADMIN] Resetting admin password...");

    try {
      await connectToDatabase();
      console.log("🔑 [RESET ADMIN] Database connected");

      // Find the admin user
      const adminUser = await User.findOne({
        email: "admin@rudegyalconfessions.com",
      });

      if (!adminUser) {
        return res.json({
          success: false,
          message: "Admin user not found",
        });
      }

      // Reset password to admin123
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash("admin123", saltRounds);

      adminUser.password = hashedPassword;
      adminUser.active = true; // Make sure user is active
      await adminUser.save();

      console.log("🔑 [RESET ADMIN] ✅ Password reset successfully");

      res.json({
        success: true,
        message: "Admin password reset successfully!",
        credentials: {
          email: "admin@rudegyalconfessions.com",
          password: "admin123",
        },
        userInfo: {
          email: adminUser.email,
          username: adminUser.username,
          type: adminUser.type,
          active: adminUser.active,
        },
      });
    } catch (error) {
      console.error("🔑 [RESET ADMIN] ❌ Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reset admin password",
        error: error.message,
      });
    }
  });

  // CHECK USERS ENDPOINT
  app.get("/api/check-users", async (req, res) => {
    console.log("👥 [CHECK USERS] Checking existing users...");

    try {
      await connectToDatabase();

      const users = await User.find(
        {},
        {
          email: 1,
          username: 1,
          type: 1,
          active: 1,
          createdAt: 1,
        },
      ).limit(10);

      console.log(`👥 [CHECK USERS] Found ${users.length} users`);

      res.json({
        success: true,
        userCount: users.length,
        users: users.map((user) => ({
          email: user.email,
          username: user.username,
          type: user.type,
          active: user.active,
          createdAt: user.createdAt,
        })),
      });
    } catch (error) {
      console.error("👥 [CHECK USERS] ❌ Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check users",
        error: error.message,
      });
    }
  });

  // REAL DATABASE LOGIN
  app.post("/api/auth/login", async (req, res) => {
    console.log("🔐 [LOGIN] ==========================================");
    console.log("🔐 [LOGIN] Login attempt received");

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    console.log(`🔐 [LOGIN] Attempting login for: ${email}`);

    // Try database authentication first
    try {
      await connectToDatabase();
      console.log("🔐 [LOGIN] Database connected, trying database auth");

      const user = await User.findOne({ email: email.toLowerCase() });

      if (user && user.active) {
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (isValidPassword) {
          console.log("🔐 [LOGIN] ✅ Database login successful");
          const token = `db_token_${user.userId}_${Date.now()}`;

          // Create login log
          try {
            // Extract IP address with proper header checking
            const rawIP = req.headers["x-forwarded-for"] ||
                         req.headers["x-real-ip"] ||
                         req.socket.remoteAddress ||
                         "unknown";

            // Clean IP if it has multiple IPs (take first one)
            const clientIP = rawIP.includes(',') ? rawIP.split(',')[0].trim() : rawIP;

            // Get country and city from IP using geolocation
            const country = getCountryFromIP(clientIP);
            const city = getCityFromIP(clientIP);

            console.log(`🔐 [LOGIN] IP geolocation: ${rawIP} -> ${clientIP} -> ${country}, ${city}`);

            const loginLog = new LoginLog({
              logId: `success_${Date.now()}`,
              userId: user.userId,
              username: user.username,
              ip: clientIP,
              country: country,
              city: city,
              userAgent: req.headers["user-agent"] || "Unknown",
              success: true,
              timestamp: new Date(),
            });
            await loginLog.save();
            console.log("🔐 [LOGIN] ✅ Login log created successfully");
          } catch (logError) {
            console.error("🔐 [LOGIN] ❌ Failed to create login log:", logError);
          }

          return res.json({
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
        }
      }
    } catch (dbError) {
      console.error(
        "🔐 [LOGIN] Database failed, trying local users:",
        dbError.message,
      );

      // Fallback to local users when database is unavailable
      try {
        const { authenticateUser, initializeLocalUsers } = await import(
          "../lib/local-users.js"
        );

        // Initialize local users if needed
        await initializeLocalUsers();

        console.log("🔐 [LOGIN] Trying local authentication");
        const user = await authenticateUser(email, password);

        if (user) {
          console.log("🔐 [LOGIN] ✅ Local authentication successful");
          const token = `local_token_${user.id}_${Date.now()}`;

          return res.json({
            success: true,
            message: "Login successful (local)",
            token: token,
            user: {
              id: user.id,
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
        }
      } catch (localError) {
        console.error(
          "🔐 [LOGIN] Local authentication failed:",
          localError.message,
        );
      }
    }

    console.log("🔐 [LOGIN] ❌ All authentication methods failed");
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  });

  // RELIABLE STORIES ENDPOINT WITH FALLBACK
  app.get("/api/stories", async (req, res) => {
    console.log("📚 [STORIES] Fetching stories...");

    // RELIABLE FALLBACK STORIES THAT ALWAYS WORK
    const reliableStories = [
      {
        id: "story-reliable-001",
        title: "Midnight Whispers",
        content:
          "<h1>Chapter One: The Encounter</h1><p>In the sultry heat of a Caribbean night, Maria found herself drawn to the mysterious stranger who had been watching her from across the resort pool...</p><p>His dark eyes held secrets she desperately wanted to uncover, and when he finally approached, his voice was like velvet against her skin.</p><p>'I've been waiting for you,' he whispered, his accent thick with promise. 'All evening, all my life.'</p><h2>The Dance:</h2><p>The music from the resort bar drifted across the water, a slow reggae rhythm that seemed to pulse with the heat of the night. Maria felt her heart racing as the stranger extended his hand.</p><p>'Dance with me,' he said, and she knew there was no refusing such a request.</p>",
        excerpt:
          "A chance encounter at a Caribbean resort leads to an unforgettable night of passion and mystery.",
        author: "Jasmine Rose",
        category: "Romance",
        tags: ["passionate", "romance", "vacation", "mystery", "caribbean"],
        accessLevel: "free",
        isPublished: true,
        publishedAt: new Date("2024-01-15"),
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        viewCount: 1247,
        rating: 4.8,
        ratingCount: 89,
        image: null,
        audioUrl: "/uploads/audio/sample-midnight-whispers.mp3", // Sample audio for testing
      },
      {
        id: "story-reliable-002",
        title: "The Professor's Secret",
        content:
          "<h1>After Hours</h1><p>Elena had always been the best student in Professor Martinez's literature class, but tonight's private study session was about to become something much more intimate...</p><p>As rain pattered against the library windows, she found herself alone with the man who had been the subject of her secret fantasies for months.</p><p>'You understand the poetry better than any student I've ever taught,' he said, moving closer. 'But I wonder if you understand the passion behind the words.'</p><h2>The Lesson:</h2><p>The leather-bound book of sonnets lay forgotten on the mahogany desk as Professor Martinez traced a line from Neruda with his finger, his eyes never leaving Elena's face.</p><p>'Poetry is about desire,' he whispered. 'About the space between what we say and what we mean.'</p>",
        excerpt:
          "A brilliant student discovers that some lessons can only be learned after hours.",
        author: "Carmen Silva",
        category: "Forbidden",
        tags: [
          "forbidden",
          "academic",
          "intellectual",
          "tension",
          "literature",
        ],
        accessLevel: "premium",
        isPublished: true,
        publishedAt: new Date("2024-01-20"),
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
        viewCount: 2156,
        rating: 4.9,
        ratingCount: 134,
        image: null,
        audioUrl: "/uploads/audio/story-audio-1755186589864.mp3", // Added the audio file you just uploaded
      },
      {
        id: "story-reliable-003",
        title: "Dancing in the Dark",
        content:
          "<h1>The Rhythm of Desire</h1><p>The salsa club was crowded, but Sophia only had eyes for one man. His hips moved to the rhythm like liquid fire, and when he extended his hand to her, she knew her quiet life was about to change forever...</p><p>'Baila conmigo,' he murmured, pulling her close enough that she could feel his heartbeat against her chest. The music pulsed through them both, a primal rhythm that spoke of desire older than words.</p><h2>The Transformation:</h2><p>For twenty-six years, Sophia had lived the life of a dutiful librarian. Quiet, reserved, predictable. But tonight, as the stranger's hands guided her hips to the music, she felt something wild awakening within her.</p><p>'Let the music move through you,' he whispered in her ear. 'Don't think, just feel.'</p>",
        excerpt:
          "A shy librarian discovers her wild side on the dance floor with a captivating stranger.",
        author: "Isabella Morales",
        category: "Seductive",
        tags: ["dance", "transformation", "passionate", "music", "salsa"],
        accessLevel: "free",
        isPublished: true,
        publishedAt: new Date("2024-01-25"),
        createdAt: new Date("2024-01-25"),
        updatedAt: new Date("2024-01-25"),
        viewCount: 892,
        rating: 4.6,
        ratingCount: 67,
        image: null,
        audioUrl: "/uploads/audio/sample-dancing-dark.mp3", // Sample audio for testing
      },
      {
        id: "story-reliable-004",
        title: "Summer Storm",
        content:
          "<h1>When Lightning Strikes</h1><p>When the power went out during the thunderstorm, Amelia thought she was alone in the beach house. But then she heard footsteps on the deck, and realized her mysterious neighbor had come to check on her...</p><p>By candlelight, with rain lashing the windows, they talked until dawn. But it wasn't just conversation that kept them awake all night.</p><h2>Shelter from the Storm:</h2><p>'I brought candles,' he said, setting down a bag by the door. 'And wine. Figured we might as well make the best of it.'</p><p>Amelia watched him move through her kitchen with confident familiarity, as if he belonged there. As if this moment had always been inevitable.</p>",
        excerpt:
          "A power outage brings two lonely hearts together during a wild summer storm.",
        author: "Maya Rodriguez",
        category: "Romance",
        tags: ["storm", "neighbors", "candlelight", "intimate", "wine"],
        accessLevel: "premium",
        isPublished: true,
        publishedAt: new Date("2024-01-30"),
        createdAt: new Date("2024-01-30"),
        updatedAt: new Date("2024-01-30"),
        viewCount: 1634,
        rating: 4.7,
        ratingCount: 102,
        image: null,
      },
      {
        id: "story-reliable-005",
        title: "Art of Desire",
        content:
          "<h1>The Perfect Model</h1><p>Painting the male figure had always been academic for Rosa, until the day Marcus walked into her art studio. His sculpted physique was perfection, but it was the intensity in his eyes that made her hand tremble as she tried to capture his essence on canvas...</p><p>'Am I making you nervous?' he asked during their third session, noticing how she couldn't quite meet his gaze. 'Perhaps we should take a break from the formal poses.'</p><h2>Beyond the Canvas:</h2><p>Rosa set down her brush, her hands shaking slightly. In ten years of figure drawing, she had never felt this way about a model. Marcus stepped down from the platform, moving toward her with the same fluid grace she had been trying to capture in paint.</p><p>'You see me,' he said softly. 'Really see me. I can tell by the way you paint.'</p>",
        excerpt:
          "An artist finds inspiration and passion when the perfect model walks into her studio.",
        author: "Valentina Cruz",
        category: "Fantasy",
        tags: ["art", "model", "studio", "creative", "painting"],
        accessLevel: "free",
        isPublished: true,
        publishedAt: new Date("2024-02-05"),
        createdAt: new Date("2024-02-05"),
        updatedAt: new Date("2024-02-05"),
        viewCount: 976,
        rating: 4.5,
        ratingCount: 78,
        image: null,
      },
    ];

    // Try database first as backup
    try {
      await connectToDatabase();
      console.log("📚 [STORIES] Database connected, trying database stories");

      const stories = await Story.find({ published: true })
        .sort({ createdAt: -1 })
        .lean();

      if (stories && stories.length > 0) {
        console.log(`📚 [STORIES] ✅ Found ${stories.length} database stories`);

        // Debug: Log some actual stats to verify production data
        const firstStory = stories[0];
        console.log(`📊 [DEBUG] Sample story stats:`, {
          title: firstStory.title,
          viewCount: firstStory.viewCount,
          rating: firstStory.rating,
          likeCount: firstStory.likeCount,
          commentCount: firstStory.commentCount,
          ratingCount: firstStory.ratingCount,
        });

        // Optimize: Get all comment counts in a single aggregation query
        console.log("📚 [STORIES] Getting comment counts for all stories...");
        const commentCounts = await Comment.aggregate([
          {
            $group: {
              _id: "$storyId",
              count: { $sum: 1 }
            }
          }
        ]);

        // Create a map for quick lookup
        const commentCountMap = {};
        commentCounts.forEach(item => {
          commentCountMap[item._id] = item.count;
        });

        console.log("📚 [STORIES] Transforming stories with optimized comment counts...");
        const transformedStories = stories.map((story) => {
          const commentCount = commentCountMap[story.storyId] || 0;

          return {
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
            // Use correct MongoDB field names from production database (after sync)
            viewCount: story.viewCount || 0, // MongoDB field is 'viewCount' after sync
            rating: story.rating || 0, // MongoDB field is 'rating' after sync
            ratingCount: story.ratingCount || 0,
            likeCount: story.likeCount || 0,
            commentCount: commentCount, // Use optimized comment count
            image: story.image || null,
            audioUrl: story.audioUrl || null,
          };
        });

        return res.json(transformedStories);
      }
    } catch (dbError) {
      console.error(
        "📚 [STORIES] Database failed (expected):",
        dbError.message,
      );
    }

    // Return reliable fallback stories
    console.log("📚 [STORIES] �� Using reliable fallback stories");
    res.json(reliableStories);
  });

  // WORKING EMAIL TEST ENDPOINT
  app.post("/api/test-email", async (req, res) => {
    console.log("🚀 [EMAIL TEST] ==========================================");
    console.log("🚀 [EMAIL TEST] Test email request received!");
    console.log("🚀 [EMAIL TEST] Method:", req.method);
    console.log("���� [EMAIL TEST] Headers:", req.headers);
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
                <li>��� Resend API connection established</li>
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

  // Add specific audio upload route with proper error handling
  app.post("/api/upload-audio", async (req, res) => {
    console.log("[SERVER] Audio upload request received");
    try {
      const { default: handler } = await import("../api/upload-audio.js");
      return handler(req, res);
    } catch (error) {
      console.error("[SERVER] Failed to import audio upload handler:", error);
      return res.status(500).json({
        success: false,
        message: "Audio upload handler not available",
        error: error.message,
      });
    }
  });

  // Add specific story update route with proper error handling
  app.put("/api/stories/:id", async (req, res) => {
    console.log(
      `[SERVER] Story update request received for ID: ${req.params.id}`,
    );
    try {
      // Set the id in the query object for the handler
      req.query = { id: req.params.id };
      const { default: handler } = await import("../api/stories/[id].js");
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import story handler for ${req.params.id}:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Story update handler not available",
        error: error.message,
      });
    }
  });

  // Add story view tracking route
  app.post("/api/stories/:id/view", async (req, res) => {
    console.log(`[SERVER] Story view request for ID: ${req.params.id}`);
    try {
      req.query = { id: req.params.id };
      const { default: handler } = await import("../api/stories/[id]/view.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import view handler:`, error);
      return res.status(500).json({
        success: false,
        message: "View handler not available",
        error: error.message,
      });
    }
  });

  // Add story stats route
  app.get("/api/stories/:id/stats", async (req, res) => {
    console.log(`[SERVER] Story stats request for ID: ${req.params.id}`);
    try {
      req.query = { id: req.params.id };
      const { default: handler } = await import("../api/stories/[id]/stats.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import stats handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Stats handler not available",
        error: error.message,
      });
    }
  });

  // Add story like route
  app.post("/api/stories/:id/like", async (req, res) => {
    console.log(`[SERVER] Story like request for ID: ${req.params.id}`);
    try {
      req.query = { id: req.params.id };
      const { default: handler } = await import("../api/stories/[id]/like.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import like handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Like handler not available",
        error: error.message,
      });
    }
  });

  // Add story rating route
  app.post("/api/stories/:id/rating", async (req, res) => {
    console.log(`[SERVER] Story rating request for ID: ${req.params.id}`);
    try {
      req.query = { id: req.params.id };
      const { default: handler } = await import(
        "../api/stories/[id]/rating.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import rating handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Rating handler not available",
        error: error.message,
      });
    }
  });

  // Add comments routes
  app.get("/api/comments", async (req, res) => {
    console.log(`[SERVER] Comments GET request`);
    try {
      const { default: handler } = await import("../api/comments.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import comments handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Comments handler not available",
        error: error.message,
      });
    }
  });

  app.post("/api/comments", async (req, res) => {
    console.log(`[SERVER] Comments POST request`);
    try {
      const { default: handler } = await import("../api/comments.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import comments handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Comments handler not available",
        error: error.message,
      });
    }
  });

  app.delete("/api/comments", async (req, res) => {
    console.log(`[SERVER] Comments DELETE request`);
    try {
      const { default: handler } = await import("../api/comments.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import comments handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Comments handler not available",
        error: error.message,
      });
    }
  });

  // Add user story read tracking route
  app.post("/api/user-story-reads", async (req, res) => {
    console.log(`[SERVER] User story read request`);
    try {
      const { default: handler } = await import("../api/user-story-reads.js");
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import user-story-reads handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "User story reads handler not available",
        error: error.message,
      });
    }
  });

  app.get("/api/user-story-reads", async (req, res) => {
    console.log(`[SERVER] User story read history request`);
    try {
      const { default: handler } = await import("../api/user-story-reads.js");
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import user-story-reads handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "User story reads handler not available",
        error: error.message,
      });
    }
  });

  // Add fix story stats route for debugging
  app.post("/api/fix-story-stats", async (req, res) => {
    console.log(`[SERVER] Fix story stats request`);
    try {
      const { default: handler } = await import("../api/fix-story-stats.js");
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import fix-story-stats handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Fix story stats handler not available",
        error: error.message,
      });
    }
  });

  // Add fix all story stats route for comprehensive fix
  app.post("/api/fix-all-story-stats", async (req, res) => {
    console.log(`[SERVER] Fix all story stats request`);
    try {
      const { default: handler } = await import(
        "../api/fix-all-story-stats.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import fix-all-story-stats handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Fix all story stats handler not available",
        error: error.message,
      });
    }
  });

  // Add debug document route for troubleshooting
  app.get("/api/debug-story-document", async (req, res) => {
    console.log(`[SERVER] Debug story document request`);
    try {
      const { default: handler } = await import(
        "../api/debug-story-document.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import debug-story-document handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Debug story document handler not available",
        error: error.message,
      });
    }
  });

  // Add test field update route for direct testing
  app.post("/api/test-field-update", async (req, res) => {
    console.log(`[SERVER] Test field update request`);
    try {
      const { default: handler } = await import("../api/test-field-update.js");
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import test-field-update handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Test field update handler not available",
        error: error.message,
      });
    }
  });

  // Add migration route for consolidating duplicate fields
  app.post("/api/migrate-story-fields", async (req, res) => {
    console.log(`[SERVER] Migrate story fields request`);
    try {
      const { default: handler } = await import(
        "../api/migrate-story-fields.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import migrate-story-fields handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Migrate story fields handler not available",
        error: error.message,
      });
    }
  });

  // Add comprehensive database normalization route
  app.post("/api/normalize-database-fields", async (req, res) => {
    console.log(`[SERVER] Normalize database fields request`);
    try {
      const { default: handler } = await import(
        "../api/normalize-database-fields.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import normalize-database-fields handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Normalize database fields handler not available",
        error: error.message,
      });
    }
  });

  // Add test database operations route
  app.post("/api/test-database-operations", async (req, res) => {
    console.log(`[SERVER] Test database operations request`);
    try {
      const { default: handler } = await import(
        "../api/test-database-operations.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import test-database-operations handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Test database operations handler not available",
        error: error.message,
      });
    }
  });

  // Add recreate stat fields route
  app.post("/api/recreate-stat-fields", async (req, res) => {
    console.log(`[SERVER] Recreate stat fields request`);
    try {
      const { default: handler } = await import(
        "../api/recreate-stat-fields.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import recreate-stat-fields handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Recreate stat fields handler not available",
        error: error.message,
      });
    }
  });

  // Add test stories listing route
  app.get("/api/test-stories-listing", async (req, res) => {
    console.log(`[SERVER] Test stories listing request`);
    try {
      const { default: handler } = await import(
        "../api/test-stories-listing.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import test-stories-listing handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Test stories listing handler not available",
        error: error.message,
      });
    }
  });

  // Add unified stats route for admin pages
  app.all("/api/admin/unified-stats", async (req, res) => {
    console.log(`[SERVER] Unified stats request`);
    try {
      const { default: handler } = await import(
        "../api/admin/unified-stats.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import unified-stats handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Unified stats handler not available",
        error: error.message,
      });
    }
  });

  // Add statistics consistency test route
  app.get("/api/test-stats-consistency", async (req, res) => {
    console.log(`[SERVER] Test stats consistency request`);
    try {
      const { default: handler } = await import(
        "../api/test-stats-consistency.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import test-stats-consistency handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Test stats consistency handler not available",
        error: error.message,
      });
    }
  });

  // Add test home page data route
  app.get("/api/test-home-page-data", async (req, res) => {
    console.log(`[SERVER] Test home page data request`);
    try {
      const { default: handler } = await import(
        "../api/test-home-page-data.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import test-home-page-data handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Test home page data handler not available",
        error: error.message,
      });
    }
  });

  // Add debug home stats route
  app.get("/api/debug-home-stats", async (req, res) => {
    console.log(`[SERVER] Debug home stats request`);
    try {
      const { default: handler } = await import("../api/debug-home-stats.js");
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import debug-home-stats handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Debug home stats handler not available",
        error: error.message,
      });
    }
  });

  // Add debug likes route
  app.get("/api/debug-likes", async (req, res) => {
    console.log(`[SERVER] Debug likes request`);
    try {
      const { default: handler } = await import("../api/debug-likes.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import debug-likes handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Debug likes handler not available",
        error: error.message,
      });
    }
  });

  // Add debug login logs route
  app.get("/api/debug-login-logs", async (req, res) => {
    console.log(`[SERVER] Debug login logs request`);
    try {
      const { default: handler } = await import("../api/debug-login-logs.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import debug-login-logs handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Debug login logs handler not available",
        error: error.message,
      });
    }
  });

  // Add fix Amsterdam likes route
  app.post("/api/fix-amsterdam-likes", async (req, res) => {
    console.log(`[SERVER] Fix Amsterdam likes request`);
    try {
      const { default: handler } = await import(
        "../api/fix-amsterdam-likes.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import fix-amsterdam-likes handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Fix Amsterdam likes handler not available",
        error: error.message,
      });
    }
  });

  // Add sync story field names route
  app.post("/api/sync-story-field-names", async (req, res) => {
    console.log(`[SERVER] Sync story field names request`);
    try {
      const { default: handler } = await import(
        "../api/sync-story-field-names.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import sync-story-field-names handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Sync story field names handler not available",
        error: error.message,
      });
    }
  });

  // Add debug stats comparison route
  app.get("/api/debug-stats-comparison", async (req, res) => {
    console.log(`[SERVER] Debug stats comparison request`);
    try {
      const { default: handler } = await import(
        "../api/debug-stats-comparison.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import debug-stats-comparison handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Debug stats comparison handler not available",
        error: error.message,
      });
    }
  });

  // Add admin user reading stats route
  app.get("/api/admin/user-reading-stats", async (req, res) => {
    console.log(`[SERVER] Admin user reading stats request`);
    try {
      const { default: handler } = await import(
        "../api/admin/user-reading-stats.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import user-reading-stats handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "User reading stats handler not available",
        error: error.message,
      });
    }
  });

  // Add admin login logs route
  app.all("/api/admin/login-logs", async (req, res) => {
    console.log(`[SERVER] Admin login logs request: ${req.method}`);
    try {
      const { default: handler } = await import("../api/admin/login-logs.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import login-logs handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Login logs handler not available",
        error: error.message,
      });
    }
  });

  // Add test geolocation route
  app.get("/api/test-geolocation", async (req, res) => {
    console.log(`[SERVER] Test geolocation request`);
    try {
      const { default: handler } = await import("../api/test-geolocation.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import test-geolocation handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Test geolocation handler not available",
        error: error.message,
      });
    }
  });

  // Add test city detection route
  app.get("/api/test-city-detection", async (req, res) => {
    console.log(`[SERVER] Test city detection request`);
    try {
      const { default: handler } = await import("../api/test-city-detection.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import test-city-detection handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Test city detection handler not available",
        error: error.message,
      });
    }
  });

  // Add debug login logs route
  app.get("/api/debug-login-logs", async (req, res) => {
    console.log(`[SERVER] Debug login logs request`);
    try {
      const { default: handler } = await import("../api/debug-login-logs.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import debug-login-logs handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Debug login logs handler not available",
        error: error.message,
      });
    }
  });

  // Add check login city data route
  app.get("/api/check-login-city-data", async (req, res) => {
    console.log(`[SERVER] Check login city data request`);
    try {
      const { default: handler } = await import("../api/check-login-city-data.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import check-login-city-data handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Check login city data handler not available",
        error: error.message,
      });
    }
  });

  // Add test MongoDB city route
  app.get("/api/test-mongodb-city", async (req, res) => {
    console.log(`[SERVER] Test MongoDB city request`);
    try {
      const { default: handler } = await import("../api/test-mongodb-city.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import test-mongodb-city handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Test MongoDB city handler not available",
        error: error.message,
      });
    }
  });

  // Add test login route
  app.get("/api/test-login", async (req, res) => {
    console.log(`[SERVER] Test login request`);
    try {
      const { default: handler } = await import("../api/test-login.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import test-login handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Test login handler not available",
        error: error.message,
      });
    }
  });

  // Add IPv6 city test route
  app.get("/api/test-ipv6-city", async (req, res) => {
    console.log(`[SERVER] Test IPv6 city request`);
    try {
      const { default: handler } = await import("../api/test-ipv6-city.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import test-ipv6-city handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Test IPv6 city handler not available",
        error: error.message,
      });
    }
  });

  // Add migration route for login log countries
  app.post("/api/migrate-login-countries", async (req, res) => {
    console.log(`[SERVER] Migrate login countries request`);
    try {
      const { default: handler } = await import("../api/migrate-login-countries.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import migrate-login-countries handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Migrate login countries handler not available",
        error: error.message,
      });
    }
  });

  // Add migration route for login log cities
  app.post("/api/migrate-login-cities", async (req, res) => {
    console.log(`[SERVER] Migrate login cities request`);
    try {
      const { default: handler } = await import("../api/migrate-login-cities.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import migrate-login-cities handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Migrate login cities handler not available",
        error: error.message,
      });
    }
  });

  // Add improved migration route for login log cities
  app.post("/api/migrate-login-cities-v2", async (req, res) => {
    console.log(`[SERVER] Migrate login cities v2 request`);
    try {
      const { default: handler } = await import("../api/migrate-login-cities-v2.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import migrate-login-cities-v2 handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Migrate login cities v2 handler not available",
        error: error.message,
      });
    }
  });

  // Add IPv6 city update route
  app.post("/api/update-ipv6-cities", async (req, res) => {
    console.log(`[SERVER] Update IPv6 cities request`);
    try {
      const { default: handler } = await import("../api/update-ipv6-cities.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import update-ipv6-cities handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Update IPv6 cities handler not available",
        error: error.message,
      });
    }
  });

  // Add main users API route
  app.all("/api/users", async (req, res) => {
    console.log(`[SERVER] Users API request: ${req.method}`);
    try {
      const { default: handler } = await import("../api/users.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import users handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Users handler not available",
        error: error.message,
      });
    }
  });

  // Add users stats route
  app.get("/api/users/stats", async (req, res) => {
    console.log(`[SERVER] Users stats request`);
    try {
      const { default: handler } = await import("../api/users/stats.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import users stats handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Users stats handler not available",
        error: error.message,
      });
    }
  });

  // Add user toggle active route
  app.patch("/api/users/:id/toggle-active", async (req, res) => {
    console.log(`[SERVER] User toggle active request for ID: ${req.params.id}`);
    try {
      const { default: handler } = await import(
        "../api/users/[id]/toggle-active.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import user toggle-active handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "User toggle-active handler not available",
        error: error.message,
      });
    }
  });

  // Add user delete route
  app.delete("/api/users/:id", async (req, res) => {
    console.log(`[SERVER] User delete request for ID: ${req.params.id}`);
    try {
      const { default: handler } = await import("../api/users/[id].js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import user delete handler:`, error);
      return res.status(500).json({
        success: false,
        message: "User delete handler not available",
        error: error.message,
      });
    }
  });

  // Add admin routes for user management
  app.get("/api/admin/list-users", async (req, res) => {
    console.log(`[SERVER] Admin list users request`);
    try {
      const { default: handler } = await import("../api/admin/list-users.js");
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import list-users handler:`, error);
      return res.status(500).json({
        success: false,
        message: "List users handler not available",
        error: error.message,
      });
    }
  });

  app.post("/api/admin/remove-hardcoded-auth", async (req, res) => {
    console.log(`[SERVER] Remove hardcoded auth request`);
    try {
      const { default: handler } = await import(
        "../api/admin/remove-hardcoded-auth.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import remove-hardcoded-auth handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Remove hardcoded auth handler not available",
        error: error.message,
      });
    }
  });

  app.post("/api/admin/reset-passwords", async (req, res) => {
    console.log(`[SERVER] Reset passwords request`);
    try {
      const { default: handler } = await import(
        "../api/admin/reset-passwords.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import reset-passwords handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Reset passwords handler not available",
        error: error.message,
      });
    }
  });

  // Add refresh stats route
  app.all("/api/admin/refresh-stats", async (req, res) => {
    console.log(`[SERVER] Refresh stats request`);
    try {
      const { default: handler } = await import(
        "../api/admin/refresh-stats.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import refresh-stats handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Refresh stats handler not available",
        error: error.message,
      });
    }
  });

  // Add simple user check route
  app.all("/api/simple-user-check", async (req, res) => {
    console.log(`[SERVER] Simple user check request`);
    try {
      const { default: handler } = await import("../api/simple-user-check.js");
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import simple-user-check handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Simple user check handler not available",
        error: error.message,
      });
    }
  });

  // Add force update password route
  app.all("/api/force-update-password", async (req, res) => {
    console.log(`[SERVER] Force update password request`);
    try {
      const { default: handler } = await import(
        "../api/force-update-password.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import force-update-password handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Force update password handler not available",
        error: error.message,
      });
    }
  });

  // Add debug user password route
  app.all("/api/debug-user-password", async (req, res) => {
    console.log(`[SERVER] Debug user password request`);
    try {
      const { default: handler } = await import(
        "../api/debug-user-password.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import debug-user-password handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Debug handler not available",
        error: error.message,
      });
    }
  });

  // Add reset password route handler
  app.all("/api/auth/reset-password", async (req, res) => {
    console.log(`[SERVER] Reset password request`);
    try {
      const { default: handler } = await import(
        "../api/auth/reset-password.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(`[SERVER] Failed to import reset-password handler:`, error);
      return res.status(500).json({
        success: false,
        message: "Reset password handler not available",
        error: error.message,
      });
    }
  });

  // Add registration with subscription route
  app.post("/api/auth/register-with-subscription", async (req, res) => {
    console.log(`[SERVER] Register with subscription request`);
    try {
      const { default: handler } = await import(
        "../api/auth/register-with-subscription.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import register-with-subscription handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Register with subscription handler not available",
        error: error.message,
      });
    }
  });

  // Add password reset route
  app.post("/api/auth/forgot-password", async (req, res) => {
    console.log(`[SERVER] Forgot password request`);
    try {
      const { default: handler } = await import(
        "../api/auth/forgot-password.js"
      );
      return handler(req, res);
    } catch (error) {
      console.error(
        `[SERVER] Failed to import forgot-password handler:`,
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Forgot password handler not available",
        error: error.message,
      });
    }
  });

  // FORCE CREATE ADMIN USERS ENDPOINT
  app.all("/api/force-create-admin", async (req, res) => {
    console.log("🚀 [FORCE CREATE ADMIN] Creating admin users...");

    try {
      await connectToDatabase();
      console.log("🚀 [FORCE CREATE ADMIN] Database connected");

      const saltRounds = 12;
      const adminPassword = "admin123";
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      const adminUsers = [
        {
          userId: "admin-001",
          username: "admin",
          email: "admin@rudegyalconfessions.com",
          password: hashedPassword,
          type: "admin",
          active: true,
          loginCount: 0,
          createdAt: new Date(),
          lastLogin: null,
        },
        {
          userId: "joel-001",
          username: "joelmooyoung",
          email: "joelmooyoung@me.com",
          password: hashedPassword,
          type: "admin",
          active: true,
          loginCount: 0,
          createdAt: new Date(),
          lastLogin: null,
        },
      ];

      const results = [];

      for (const adminData of adminUsers) {
        try {
          // Delete existing user if exists
          await User.deleteOne({ email: adminData.email });
          console.log(
            `🚀 [FORCE CREATE ADMIN] Deleted existing user: ${adminData.email}`,
          );

          // Create new user
          const newUser = new User(adminData);
          await newUser.save();

          console.log(
            `🚀 [FORCE CREATE ADMIN] ✅ Created admin user: ${adminData.email}`,
          );

          results.push({
            email: adminData.email,
            username: adminData.username,
            type: adminData.type,
            active: adminData.active,
            status: "created",
          });
        } catch (userError) {
          console.error(
            `🚀 [FORCE CREATE ADMIN] Failed to create ${adminData.email}:`,
            userError,
          );
          results.push({
            email: adminData.email,
            status: "failed",
            error: userError.message,
          });
        }
      }

      // Test the created users by attempting login
      const testResults = [];
      for (const adminData of adminUsers) {
        try {
          const user = await User.findOne({ email: adminData.email });
          if (user) {
            const isValidPassword = await bcrypt.compare(
              adminPassword,
              user.password,
            );
            testResults.push({
              email: adminData.email,
              exists: true,
              passwordValid: isValidPassword,
              active: user.active,
            });
          } else {
            testResults.push({
              email: adminData.email,
              exists: false,
              passwordValid: false,
              active: false,
            });
          }
        } catch (testError) {
          testResults.push({
            email: adminData.email,
            exists: false,
            passwordValid: false,
            active: false,
            error: testError.message,
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "Admin users force-created successfully",
        adminPassword: adminPassword,
        createdUsers: results,
        testResults: testResults,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("🚀 [FORCE CREATE ADMIN] ❌ Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to force-create admin users",
        error: error.message,
        timestamp: new Date().toISOString(),
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
