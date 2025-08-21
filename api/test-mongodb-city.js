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

    console.log("[TEST MONGODB] Testing direct MongoDB query for city data");

    // Get all login logs with IPv6 addresses
    const ipv6Logs = await LoginLog.find({ 
      ip: { $regex: ":" } // IPv6 addresses contain colons
    })
    .sort({ timestamp: -1 })
    .limit(5)
    .lean(); // Use lean() to get plain objects

    console.log("[TEST MONGODB] Found IPv6 logs:", JSON.stringify(ipv6Logs, null, 2));

    // Check if any have city data
    const logsWithCity = ipv6Logs.filter(log => log.city && !log.city.includes("Unknown"));
    const logsWithoutCity = ipv6Logs.filter(log => !log.city || log.city.includes("Unknown"));

    return res.status(200).json({
      success: true,
      message: "Direct MongoDB city test",
      totalIPv6Logs: ipv6Logs.length,
      logsWithCity: logsWithCity.length,
      logsWithoutCity: logsWithoutCity.length,
      allLogs: ipv6Logs.map(log => ({
        logId: log.logId,
        ip: log.ip,
        city: log.city || "NO_CITY_FIELD",
        country: log.country,
        timestamp: log.timestamp,
        hasCity: !!log.city
      })),
      firstLogRaw: ipv6Logs[0] || null
    });

  } catch (error) {
    console.error("[TEST MONGODB] Error:", error);
    return res.status(500).json({
      success: false,
      message: "MongoDB test failed",
      error: error.message
    });
  }
}
