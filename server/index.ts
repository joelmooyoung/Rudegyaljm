import express from "express";
import cors from "cors";

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

  // Fallback for API routes (redirect to serverless functions in production)
  app.use("/api/*", (req, res) => {
    if (process.env.NODE_ENV === "production") {
      // In production, these will be handled by Vercel serverless functions
      res.status(404).json({ message: "Route handled by serverless function" });
    } else {
      // In development, provide a helpful message
      res.json({
        message: `Development mode: ${req.method} ${req.path}`,
        note: "This will be handled by Vercel serverless functions in production",
      });
    }
  });

  return app;
}
