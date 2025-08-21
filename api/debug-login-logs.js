import { connectToDatabase } from "../lib/mongodb.js";
import { LoginLog } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    
    // Get the first 3 login logs to examine their structure
    const logs = await LoginLog.find({}).sort({ timestamp: -1 }).limit(3);
    
    const logData = logs.map(log => ({
      logId: log.logId,
      userId: log.userId,
      username: log.username,
      ip: log.ip,
      country: log.country,
      city: log.city,
      userAgent: log.userAgent ? log.userAgent.substring(0, 50) + "..." : "Unknown",
      timestamp: log.timestamp
    }));

    return res.status(200).json({
      success: true,
      message: "Debug login logs data",
      count: logs.length,
      data: logData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
