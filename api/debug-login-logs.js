import { connectToDatabase } from "../lib/mongodb.js";
import { LoginLog } from "../models/index.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed" 
    });
  }

  try {
    await connectToDatabase();

    // Get the most recent login log
    const latestLog = await LoginLog.findOne({})
      .sort({ timestamp: -1 })
      .select("-__v");

    if (!latestLog) {
      return res.status(200).json({
        success: true,
        message: "No login logs found",
        data: null
      });
    }

    // Show the raw data structure
    console.log("[DEBUG] Raw login log from database:", JSON.stringify(latestLog, null, 2));

    // Transform to expected format
    const transformedLog = {
      id: latestLog.logId,
      userId: latestLog.userId,
      username: latestLog.username,
      email: latestLog.username,
      ipAddress: latestLog.ip,
      country: latestLog.country,
      city: latestLog.city,
      userAgent: latestLog.userAgent,
      success: latestLog.success,
      createdAt: latestLog.timestamp,
      timestamp: latestLog.timestamp,
    };

    console.log("[DEBUG] Transformed login log:", JSON.stringify(transformedLog, null, 2));

    return res.status(200).json({
      success: true,
      message: "Latest login log retrieved",
      rawData: latestLog,
      transformedData: transformedLog,
      cityCheck: {
        rawCity: latestLog.city,
        cityExists: !!latestLog.city,
        cityValue: latestLog.city || "No city field found"
      }
    });

  } catch (error) {
    console.error("[DEBUG] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Debug failed",
      error: error.message
    });
  }
}
