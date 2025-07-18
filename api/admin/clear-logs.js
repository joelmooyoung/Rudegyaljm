// Clear logs API with MongoDB integration
import { connectToDatabase } from "../../lib/mongodb.js";
import { LoginLog, ErrorLog } from "../../models/index.js";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    await connectToDatabase();

    const { type } = req.body;

    console.log(`[CLEAR-LOGS API] Clearing ${type} logs`);

    let deleteResult;
    let message;

    switch (type) {
      case "login":
        deleteResult = await LoginLog.deleteMany({});
        message = `Cleared ${deleteResult.deletedCount} login logs`;
        break;
      case "error":
        deleteResult = await ErrorLog.deleteMany({});
        message = `Cleared ${deleteResult.deletedCount} error logs`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid log type. Use 'login' or 'error'",
        });
    }

    console.log(`[CLEAR-LOGS API] ✅ ${message}`);

    return res.status(200).json({
      success: true,
      message: message,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("[CLEAR-LOGS API] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
