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
    console.log("[MIGRATE CITIES V2] Starting migration of login log cities...");
    await connectToDatabase();

    // Get ALL login logs (we'll add city to all of them)
    const logs = await LoginLog.find({});

    console.log(`[MIGRATE CITIES V2] Found ${logs.length} total logs to process`);

    if (logs.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No logs found",
        updated: 0,
        total: 0
      });
    }

    let updatedCount = 0;
    const updateSummary = [];

    // Use bulkWrite for better performance
    const bulkOps = [];

    for (const log of logs) {
      try {
        // Get the city for this IP
        const city = getCityFromIP(log.ip);
        
        // Add to bulk operations
        bulkOps.push({
          updateOne: {
            filter: { _id: log._id },
            update: { $set: { city: city } }
          }
        });

        updateSummary.push({
          logId: log.logId,
          ip: log.ip,
          country: log.country,
          newCity: city,
          user: log.username
        });

        updatedCount++;
        
        console.log(`[MIGRATE CITIES V2] Prepared update for log ${log.logId}: ${log.ip} -> ${city}`);
      } catch (error) {
        console.error(`[MIGRATE CITIES V2] Error preparing update for log ${log.logId}:`, error);
      }
    }

    // Execute bulk operations
    if (bulkOps.length > 0) {
      console.log(`[MIGRATE CITIES V2] Executing ${bulkOps.length} bulk updates...`);
      const bulkResult = await LoginLog.bulkWrite(bulkOps);
      console.log(`[MIGRATE CITIES V2] Bulk result:`, bulkResult);
    }

    console.log(`[MIGRATE CITIES V2] ✅ Migration complete. Updated ${updatedCount} records.`);

    return res.status(200).json({
      success: true,
      message: `City migration v2 completed successfully`,
      total: logs.length,
      updated: updatedCount,
      examples: updateSummary.slice(0, 5), // Show first 5 examples
      summary: {
        totalProcessed: logs.length,
        successfulUpdates: updatedCount,
        bulkOpsExecuted: bulkOps.length
      }
    });

  } catch (error) {
    console.error("[MIGRATE CITIES V2] ❌ Migration failed:", error);
    return res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message
    });
  }
}
