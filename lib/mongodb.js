import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase() {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return { isConnected: true };
  }

  // If connection exists but not ready, wait for it
  if (mongoose.connection.readyState === 2) {
    console.log("[MongoDB] Connection in progress, waiting...");
    await new Promise((resolve) => {
      mongoose.connection.on('connected', resolve);
      setTimeout(resolve, 5000); // timeout after 5 seconds
    });
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return { isConnected: true };
    }
  }

  // If there's already a mongoose connection from server, reuse it
  if (mongoose.connection && mongoose.connection.db) {
    try {
      await mongoose.connection.db.admin().ping();
      isConnected = true;
      console.log("[MongoDB] Reusing existing connection");
      return { isConnected: true };
    } catch (e) {
      console.log("[MongoDB] Existing connection is dead, creating new one");
    }
  }

  try {
    let MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/rude-gyal-confessions";

    // Fix connection string to ensure correct database name
    if (
      MONGODB_URI.includes("mongodb+srv://") &&
      !MONGODB_URI.includes("/rude-gyal-confessions")
    ) {
      // Simple fix: insert database name before query parameters
      if (MONGODB_URI.includes("?")) {
        MONGODB_URI = MONGODB_URI.replace("/?", "/rude-gyal-confessions?");
        MONGODB_URI = MONGODB_URI.replace(
          ".net?",
          ".net/rude-gyal-confessions?",
        );
      } else {
        MONGODB_URI = MONGODB_URI + "/rude-gyal-confessions";
      }
      console.log("[MongoDB] Added database name to connection string");
    }

    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: "rude-gyal-confessions", // Force database name
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
