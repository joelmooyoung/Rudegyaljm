import express from "express";
import cors from "cors";
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
} from "./routes/stories";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
  app.get("/api/stories/:id", getStory);
  app.post("/api/stories", createStory);
  app.put("/api/stories/:id", updateStory);
  app.delete("/api/stories/:id", deleteStory);
  app.patch("/api/stories/:id/publish", togglePublishStory);

  // Admin routes for logs
  app.get("/api/admin/login-logs", getLoginLogs);
  app.get("/api/admin/error-logs", getErrorLogs);
  app.post("/api/admin/clear-logs", clearLogs);

  return app;
}
