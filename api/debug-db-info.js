import mongoose from "mongoose";
import { connectToDatabase } from "../lib/mongodb.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    // Get database info
    const db = mongoose.connection.db;
    const dbName = db.databaseName;

    // List all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // Try to count documents in various collection name formats
    const counts = {};
    const possibleCollectionNames = [
      "users",
      "Users",
      "user",
      "stories",
      "Stories",
      "story",
      "comments",
      "Comments",
      "comment",
    ];

    for (const collectionName of possibleCollectionNames) {
      try {
        counts[collectionName] = await db
          .collection(collectionName)
          .countDocuments();
      } catch (e) {
        counts[collectionName] = `Error: ${e.message}`;
      }
    }

    // Check what mongoose thinks the collection names are
    const mongooseModels = {
      User: mongoose.models.User?.collection?.name,
      Story: mongoose.models.Story?.collection?.name,
      Comment: mongoose.models.Comment?.collection?.name,
    };

    return res.status(200).json({
      success: true,
      database: {
        name: dbName,
        connectionString: process.env.MONGODB_URI?.substring(0, 50) + "...",
      },
      collections: {
        actual: collectionNames,
        counts: counts,
      },
      mongoose: {
        models: mongooseModels,
        connection: mongoose.connection.readyState, // 1 = connected
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
