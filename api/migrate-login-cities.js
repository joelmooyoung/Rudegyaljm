import { connectToDatabase } from "../lib/mongodb.js";
import { LoginLog } from "../models/index.js";
import { getCityFromIP } from "../server/utils/geolocation.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed. Use POST to run migration." 
    });
  }

  try {
    console.log("[MIGRATE CITIES] Starting migration of login log cities...");
    await connectToDatabase();

    // Get all login logs that don't have city information
    const logsToUpdate = await LoginLog.find({ 
      $or: [
        { city: { $exists: false } },
        { city: null },
        { city: "" }
      ]
    });

    console.log(`[MIGRATE CITIES] Found ${logsToUpdate.length} logs to update with city information`);

    if (logsToUpdate.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No logs need city updates",
        updated: 0,
        total: 0
      });
    }

    let updatedCount = 0;
    const updateSummary = [];

    for (const log of logsToUpdate) {
      try {
        // Get the city for this IP
        const city = getCityFromIP(log.ip);
        
        // Update the log with city information
        await LoginLog.findByIdAndUpdate(log._id, {
          city: city
        });

        updateSummary.push({
          logId: log.logId,
          ip: log.ip,
          country: log.country,
          newCity: city,
          user: log.username
        });

        updatedCount++;
        
        console.log(`[MIGRATE CITIES] Updated log ${log.logId}: ${log.ip} -> ${city}`);
      } catch (error) {
        console.error(`[MIGRATE CITIES] Error updating log ${log.logId}:`, error);
      }
    }

    console.log(`[MIGRATE CITIES] ✅ Migration complete. Updated ${updatedCount} records.`);

    return res.status(200).json({
      success: true,
      message: `City migration completed successfully`,
      total: logsToUpdate.length,
      updated: updatedCount,
      examples: updateSummary.slice(0, 10), // Show first 10 examples
      summary: {
        totalProcessed: logsToUpdate.length,
        successfulUpdates: updatedCount,
        skipped: logsToUpdate.length - updatedCount
      }
    });

  } catch (error) {
    console.error("[MIGRATE CITIES] ❌ Migration failed:", error);
    return res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message
    });
  }
}
