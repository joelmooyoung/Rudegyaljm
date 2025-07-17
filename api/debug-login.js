import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    const testEmail = "admin@nocturne.com";
    const testPassword = "admin123";

    // Step 1: Find user
    const user = await User.findOne({ email: testEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        step: "find_user",
        message: "User not found",
        email: testEmail,
      });
    }

    // Step 2: Show user data (without full password)
    const userData = {
      userId: user.userId,
      email: user.email,
      username: user.username,
      type: user.type,
      passwordHash: user.password.substring(0, 30) + "...",
      passwordLength: user.password.length,
      startsWithBcrypt:
        user.password.startsWith("$2a$") || user.password.startsWith("$2b$"),
    };

    // Step 3: Test password comparison
    let passwordMatch = false;
    let passwordError = null;

    try {
      passwordMatch = await bcrypt.compare(testPassword, user.password);
    } catch (error) {
      passwordError = error.message;
    }

    // Step 4: Test with different password hashes
    const testHashes = {
      original: user.password,
      plainText: testPassword,
      bcryptNew: await bcrypt.hash(testPassword, 12),
    };

    const hashTests = {};
    for (const [hashName, hash] of Object.entries(testHashes)) {
      try {
        hashTests[hashName] = await bcrypt.compare(testPassword, hash);
      } catch (error) {
        hashTests[hashName] = `Error: ${error.message}`;
      }
    }

    return res.status(200).json({
      success: true,
      test: {
        email: testEmail,
        password: testPassword,
      },
      user: userData,
      passwordTest: {
        match: passwordMatch,
        error: passwordError,
      },
      hashTests,
      debug: {
        bcryptVersion: "bcryptjs",
        mongooseConnection: !!user._id,
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
