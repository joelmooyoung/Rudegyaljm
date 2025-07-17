export default function handler(req, res) {
  // Return environment information
  res.status(200).json({
    method: req.method,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriLength: process.env.MONGODB_URI
        ? process.env.MONGODB_URI.length
        : 0,
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
      allEnvKeys: Object.keys(process.env).filter(
        (key) =>
          key.includes("NODE") ||
          key.includes("MONGO") ||
          key.includes("VERCEL"),
      ),
    },
    timestamp: new Date().toISOString(),
    isPostMethod: req.method === "POST",
  });
}
