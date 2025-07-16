import express from "express";
import cors from "cors";
import { connectDB } from "./config/database";
import { handleDemo } from "./routes/demo";
import {
  handleLogin,
  handleRegister,
  getLoginLogs,
  getErrorLogs,
  clearLogs,
} from "./routes/auth";
import {
  getStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  togglePublishStory,
  searchStories,
} from "./routes/stories";
import {
  getStoryComments,
  addStoryComment,
  deleteComment,
  rateStory,
  toggleStoryLike,
  getUserInteraction,
  getStoryStats,
  incrementStoryViews,
} from "./routes/interactions";
import { uploadImage, copyImageFromUrl, testUpload } from "./routes/upload";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  getUserStats,
} from "./routes/users";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" })); // Increase limit for image uploads
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Serve uploaded files
  app.use("/uploads", express.static("public/uploads"));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegister);

  // Story routes
  app.get("/api/stories", getStories);
  app.get("/api/stories/search", searchStories);
  app.get("/api/stories/:id", getStory);
  app.post("/api/stories", createStory);
  app.put("/api/stories/:id", updateStory);
  app.delete("/api/stories/:id", deleteStory);
  app.patch("/api/stories/:id/publish", togglePublishStory);

  // Story interaction routes
  app.get("/api/stories/:id/comments", getStoryComments);
  app.post("/api/stories/:id/comments", addStoryComment);
  app.delete("/api/stories/:id/comments/:commentId", deleteComment);
  app.post("/api/stories/:id/rating", rateStory);
  app.post("/api/stories/:id/like", toggleStoryLike);
  app.get("/api/stories/:id/user-interaction", getUserInteraction);
  app.get("/api/stories/:id/stats", getStoryStats);
  app.post("/api/stories/:id/view", incrementStoryViews);

  // Upload routes
  app.post("/api/upload/image", uploadImage);
  app.post("/api/upload/copy-url", copyImageFromUrl);
  app.get("/api/upload/test", testUpload);

  // Admin routes for logs
  app.get("/api/admin/login-logs", getLoginLogs);
  app.get("/api/admin/error-logs", getErrorLogs);
  app.post("/api/admin/clear-logs", clearLogs);

  // User management routes (admin only)
  app.get("/api/users", getUsers);
  app.get("/api/users/stats", getUserStats);
  app.get("/api/users/:id", getUser);
  app.post("/api/users", createUser);
  app.put("/api/users/:id", updateUser);
  app.delete("/api/users/:id", deleteUser);
  app.patch("/api/users/:id/toggle-active", toggleUserActive);

  return app;
}

// Initialize database connection and start server
const initializeServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("✅ Database connected successfully");

    // Check if we should seed the database
    if (process.env.SEED_DB === "true") {
      console.log("🌱 Seeding database...");
      const seedDatabase = await import("./scripts/seed");
      await seedDatabase.default();
    }
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    console.log(
      "💡 Please ensure MongoDB is running at: mongodb://localhost:27017",
    );
    console.log(
      "💡 Or set MONGODB_URI environment variable to your MongoDB connection string",
    );
    process.exit(1);
  }
};

// Start database initialization if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeServer();
}
