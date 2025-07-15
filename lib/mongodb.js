import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/rude-gyal-confessions";

    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    isConnected = true;
    console.log("[MongoDB] Connected successfully");
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    throw error;
  }
}

export default mongoose;
