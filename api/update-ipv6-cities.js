import { connectToDatabase } from "../lib/mongodb.js";
import { LoginLog } from "../models/index.js";
import { getCityFromIP } from "../server/utils/geolocation.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed. Use POST to run update." 
    });
  }

  try {
    console.log("[UPDATE IPv6 CITIES] Starting update of IPv6 login log cities...");
    await connectToDatabase();

    // Get login logs with IPv6 addresses (contain colons) that show Unknown City
    const ipv6Logs = await LoginLog.find({ 
      ip: { $regex: ":" }, // IPv6 addresses contain colons
      $or: [
        { city: "Unknown City" },
        { city: "Unknown City (IPv6)" },
        { city: { $exists: false } },
        { city: null },
        { city: "" }
      ]
    });

    console.log(`[UPDATE IPv6 CITIES] Found ${ipv6Logs.length} IPv6 logs to update`);

    if (ipv6Logs.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No IPv6 logs need city updates",
        updated: 0,
        total: 0
      });
    }

    let updatedCount = 0;
    const updateSummary = [];

    for (const log of ipv6Logs) {
      try {
        // Get the correct city for this IPv6 address
        const newCity = getCityFromIP(log.ip);
        
        // Only update if the city changed
        if (newCity !== log.city && !newCity.includes("Unknown")) {
          await LoginLog.findByIdAndUpdate(log._id, {
            city: newCity
          });

          updateSummary.push({
            logId: log.logId,
            ip: log.ip,
            oldCity: log.city,
            newCity: newCity,
            user: log.username
          });

          updatedCount++;
          
          console.log(`[UPDATE IPv6 CITIES] Updated log ${log.logId}: ${log.ip} -> ${newCity}`);
        }
      } catch (error) {
        console.error(`[UPDATE IPv6 CITIES] Error updating log ${log.logId}:`, error);
      }
    }

    console.log(`[UPDATE IPv6 CITIES] ✅ Update complete. Updated ${updatedCount} records.`);

    return res.status(200).json({
      success: true,
      message: `IPv6 city update completed successfully`,
      total: ipv6Logs.length,
      updated: updatedCount,
      examples: updateSummary,
      summary: {
        totalProcessed: ipv6Logs.length,
        successfulUpdates: updatedCount,
        skipped: ipv6Logs.length - updatedCount
      }
    });

  } catch (error) {
    console.error("[UPDATE IPv6 CITIES] ❌ Update failed:", error);
    return res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message
    });
  }
}
