import { connectToDatabase } from "../lib/mongodb.js";
import { LoginLog } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    
    // Get the most recent login log
    const latestLog = await LoginLog.findOne({}).sort({ timestamp: -1 });
    
    if (!latestLog) {
      return res.status(200).json({
        success: true,
        message: "No login logs found"
      });
    }

    // Check if city field exists and what its value is
    const cityFieldExists = latestLog.city !== undefined;
    const cityValue = latestLog.city;
    
    // Get all field names from the document
    const allFields = Object.keys(latestLog.toObject());
    
    return res.status(200).json({
      success: true,
      latestLog: {
        logId: latestLog.logId,
        ip: latestLog.ip,
        country: latestLog.country,
        city: latestLog.city,
        timestamp: latestLog.timestamp
      },
      cityFieldExists: cityFieldExists,
      cityValue: cityValue,
      allFields: allFields,
      hasCityField: allFields.includes('city')
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
