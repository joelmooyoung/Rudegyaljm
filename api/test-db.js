import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    const userCount = await User.countDocuments();

    return res.status(200).json({
      success: true,
      message: "Database connected successfully",
      userCount: userCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
}
