import { connectToDatabase } from "../lib/mongodb.js";

export default async function handler(req, res) {
  console.log(`[SIMPLE USER CHECK] ${req.method} /api/simple-user-check`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    console.log("[SIMPLE USER CHECK] Attempting database connection...");
    
    await connectToDatabase();
    console.log("[SIMPLE USER CHECK] ✅ Database connected");

    // Use raw MongoDB queries to avoid model validation issues
    const mongoose = await import("mongoose");
    const db = mongoose.default.connection.db;
    
    console.log("[SIMPLE USER CHECK] Checking collections...");
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("[SIMPLE USER CHECK] Collections found:", collections.map(c => c.name));
    
    // Check if users collection exists
    const hasUsersCollection = collections.some(c => c.name === 'users');
    
    let users = [];
    let userCount = 0;
    
    if (hasUsersCollection) {
      console.log("[SIMPLE USER CHECK] Users collection found, querying...");
      
      // Use raw collection query to avoid model issues
      const usersCollection = db.collection('users');
      
      // Get count first
      userCount = await usersCollection.countDocuments();
      console.log(`[SIMPLE USER CHECK] Total users: ${userCount}`);
      
      // Get sample users with simple projection
      users = await usersCollection.find({}, {
        projection: {
          _id: 0,
          email: 1,
          username: 1,
          type: 1,
          active: 1,
          createdAt: 1,
          lastLogin: 1
        }
      }).limit(10).toArray();
      
      console.log(`[SIMPLE USER CHECK] Sample users retrieved: ${users.length}`);
    } else {
      console.log("[SIMPLE USER CHECK] No users collection found");
    }

    // Check specific user
    let joelUser = null;
    if (hasUsersCollection) {
      const usersCollection = db.collection('users');
      joelUser = await usersCollection.findOne(
        { email: "joelmooyoung@me.com" },
        { projection: { email: 1, username: 1, type: 1, active: 1, _id: 0 } }
      );
      console.log("[SIMPLE USER CHECK] Joel user lookup:", joelUser ? "FOUND" : "NOT FOUND");
    }

    return res.status(200).json({
      success: true,
      message: "Simple user check completed",
      collections: collections.map(c => c.name),
      hasUsersCollection: hasUsersCollection,
      userCount: userCount,
      sampleUsers: users,
      joelUser: joelUser,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[SIMPLE USER CHECK] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Simple user check failed",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}
