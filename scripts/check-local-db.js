#!/usr/bin/env node

import mongoose from "mongoose";
import { User, Story } from "../models/index.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rude-gyal-confessions";

async function checkDatabase() {
  try {
    console.log("🔍 Checking local MongoDB database...");
    console.log(
      "Connection URI:",
      MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
    );

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");

    // Check collections exist
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📁 Available collections:",
      collections.map((c) => c.name),
    );

    // Check user count
    const userCount = await User.countDocuments();
    console.log(`👥 Users in database: ${userCount}`);

    // List existing users (hide passwords)
    if (userCount > 0) {
      const users = await User.find({}, { password: 0 }).limit(10);
      console.log("👤 Existing users:");
      users.forEach((user) => {
        console.log(
          `  - ${user.email} (${user.username}) - Role: ${user.type || user.role} - Active: ${user.active}`,
        );
      });
    }

    // Check story count
    const storyCount = await Story.countDocuments();
    console.log(`📚 Stories in database: ${storyCount}`);

    // List some stories
    if (storyCount > 0) {
      const stories = await Story.find({}, { content: 0 }).limit(5);
      console.log("📖 Sample stories:");
      stories.forEach((story) => {
        console.log(
          `  - "${story.title}" by ${story.author} (Views: ${story.views || 0})`,
        );
      });
    }

    console.log("\n✅ Database check completed successfully");

    if (userCount === 0) {
      console.log(
        "\n💡 No users found. Create users through the registration process.",
      );
    }
  } catch (error) {
    console.error("❌ Database check failed:", error.message);

    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 MongoDB Connection Failed. This might mean:");
      console.log("   1. MongoDB is not running locally");
      console.log("   2. MongoDB is running on a different port");
      console.log("   3. Connection string is incorrect");
      console.log("\n🚀 To fix this:");
      console.log(
        "   - Start MongoDB: brew services start mongodb/brew/mongodb-community",
      );
      console.log(
        "   - Or use Docker: docker run -d -p 27017:27017 mongo:latest",
      );
      console.log("   - Or update .env to use MongoDB Atlas");
    }
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase().catch(console.error);
