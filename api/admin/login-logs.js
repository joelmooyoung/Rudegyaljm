// Admin login logs API with MongoDB integration
import { connectToDatabase } from "../../lib/mongodb.js";
import { LoginLog } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(`[LOGIN-LOGS API] ${req.method} /api/admin/login-logs`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    switch (req.method) {
      case "GET":
        console.log(`[LOGIN-LOGS API] Fetching login logs`);

        const logs = await LoginLog.find({})
          .sort({ timestamp: -1 })
          .limit(100)
          .select("-__v");

        // Transform to expected format (map backend fields to frontend fields)
        const transformedLogs = logs.map((log) => ({
          id: log.logId,
          userId: log.userId,
          username: log.username,
          email: log.username, // Use username as email fallback since email isn't stored in LoginLog
          ipAddress: log.ip, // Map ip to ipAddress
          country: log.country,
          city: log.city, // Add city field
          userAgent: log.userAgent,
          success: log.success,
          createdAt: log.timestamp, // Map timestamp to createdAt
          timestamp: log.timestamp, // Keep timestamp for backward compatibility
        }));

        console.log(`[LOGIN-LOGS API] Found ${transformedLogs.length} logs`);

        return res.status(200).json({
          success: true,
          data: transformedLogs,
          count: transformedLogs.length,
        });

      case "DELETE":
        console.log(`[LOGIN-LOGS API] Clearing all login logs`);

        const deleteResult = await LoginLog.deleteMany({});

        console.log(
          `[LOGIN-LOGS API] ✅ Cleared ${deleteResult.deletedCount} login logs`,
        );

        return res.status(200).json({
          success: true,
          message: `Cleared ${deleteResult.deletedCount} login logs`,
          deletedCount: deleteResult.deletedCount,
        });

      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[LOGIN-LOGS API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
