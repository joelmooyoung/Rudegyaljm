import mongoose from "mongoose";
import { User, Story, LoginLog, Comment } from "../models/index.js";

async function verifyLocalDatabase() {
  try {
    console.log("🔍 Verifying local MongoDB data...");

    // Connect to local MongoDB
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/rude-gyal-confessions";

    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    console.log("✅ Connected to local MongoDB");

    // Count documents in each collection
    const userCount = await User.countDocuments();
    const storyCount = await Story.countDocuments();
    const commentCount = await Comment.countDocuments();
    const loginLogCount = await LoginLog.countDocuments();

    console.log("\n📊 Database Contents:");
    console.log(`- Users: ${userCount}`);
    console.log(`- Stories: ${storyCount}`);
    console.log(`- Comments: ${commentCount}`);
    console.log(`- Login Logs: ${loginLogCount}`);

    // Show user details
    console.log("\n👥 Users:");
    const users = await User.find({}, "username email type active").sort({
      type: 1,
    });
    users.forEach((user) => {
      const status = user.active ? "✅" : "❌";
      console.log(
        `  ${status} ${user.username} (${user.email}) - ${user.type}`,
      );
    });

    // Show story details
    console.log("\n📚 Stories:");
    const stories = await Story.find(
      {},
      "title author published featured views",
    ).sort({ views: -1 });
    stories.forEach((story) => {
      const pubStatus = story.published ? "📖" : "📝";
      const featuredStatus = story.featured ? "⭐" : "";
      console.log(
        `  ${pubStatus} "${story.title}" by ${story.author} (${story.views} views) ${featuredStatus}`,
      );
    });

    await mongoose.disconnect();
    console.log("\n��� Verification complete!");
  } catch (error) {
    console.error("❌ Error verifying database:", error);
    process.exit(1);
  }
}

// Run the verification script
verifyLocalDatabase();
