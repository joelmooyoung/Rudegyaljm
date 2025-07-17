import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return { isConnected: true };
  }

  try {
    let MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/rude-gyal-confessions";

    // Ensure database name is included in connection string
    if (
      MONGODB_URI.includes("mongodb+srv://") &&
      !MONGODB_URI.includes("/rude-gyal-confessions")
    ) {
      // Add database name to connection string if missing
      MONGODB_URI = MONGODB_URI.replace(
        "mongodb.net/",
        "mongodb.net/rude-gyal-confessions/",
      );
      MONGODB_URI = MONGODB_URI.replace(
        "mongodb.net?",
        "mongodb.net/rude-gyal-confessions?",
      );
      console.log("[MongoDB] Fixed connection string to include database name");
    }

    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    isConnected = true;
    console.log(
      `[MongoDB] Connected successfully to database: ${mongoose.connection.db.databaseName}`,
    );
    return { isConnected: true };
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    return { isConnected: false, error: error.message };
  }
}

export default mongoose;
