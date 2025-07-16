// Global middleware for all API routes
export default function middleware(req, res, next) {
  // Enable CORS for all API endpoints
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Add error handling wrapper
  const originalSend = res.send;
  res.send = function (data) {
    try {
      return originalSend.call(this, data);
    } catch (error) {
      console.error("API Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  // Continue to the actual API handler
  if (next) next();
}
