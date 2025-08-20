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

  // Don't create a new connection if one already exists - just return success
  if (mongoose.connection.readyState !== 0) {
    console.log("[MongoDB] Connection already exists, state:", mongoose.connection.readyState);
    isConnected = true;
    return { isConnected: true };
  }

  try {
    let MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/rude-gyal-confessions";

    // Use the same connection string format as server to avoid conflicts
    console.log("[MongoDB] Creating new connection with URI");

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
