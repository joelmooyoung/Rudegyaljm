import { connectToDatabase } from "../lib/mongodb.js";
import { LoginLog } from "../models/index.js";
import { getCountryFromIP } from "../server/utils/geolocation.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      message: "Method not allowed. Use POST to run migration." 
    });
  }

  try {
    console.log("[MIGRATE COUNTRIES] Starting migration of login log countries...");
    await connectToDatabase();

    // Get all login logs that have "Unknown" country
    const logsToUpdate = await LoginLog.find({ 
      $or: [
        { country: "Unknown" },
        { country: { $exists: false } },
        { country: null }
      ]
    });

    console.log(`[MIGRATE COUNTRIES] Found ${logsToUpdate.length} logs to update`);

    if (logsToUpdate.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No logs need country updates",
        updated: 0,
        total: 0
      });
    }

    let updatedCount = 0;
    const updateSummary = [];

    for (const log of logsToUpdate) {
      try {
        // Get the correct country for this IP
        const newCountry = getCountryFromIP(log.ip);
        
        // Only update if the country is different from what we have
        if (newCountry !== log.country) {
          await LoginLog.findByIdAndUpdate(log._id, {
            country: newCountry
          });

          updateSummary.push({
            logId: log.logId,
            ip: log.ip,
            oldCountry: log.country,
            newCountry: newCountry,
            user: log.username
          });

          updatedCount++;
          
          console.log(`[MIGRATE COUNTRIES] Updated log ${log.logId}: ${log.ip} -> ${newCountry}`);
        }
      } catch (error) {
        console.error(`[MIGRATE COUNTRIES] Error updating log ${log.logId}:`, error);
      }
    }

    console.log(`[MIGRATE COUNTRIES] ✅ Migration complete. Updated ${updatedCount} records.`);

    return res.status(200).json({
      success: true,
      message: `Migration completed successfully`,
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
    console.error("[MIGRATE COUNTRIES] ❌ Migration failed:", error);
    return res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message
    });
  }
}
