import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[FORCE CREATE ADMIN] ${req.method} /api/force-create-admin`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    console.log("[FORCE CREATE ADMIN] ✅ Database connected");

    const saltRounds = 12;
    const adminPassword = "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const adminUsers = [
      {
        userId: "admin-001",
        username: "admin",
        email: "admin@rudegyalconfessions.com",
        password: hashedPassword,
        type: "admin",
        active: true,
        loginCount: 0,
        createdAt: new Date(),
        lastLogin: null,
      },
      {
        userId: "joel-001",
        username: "joelmooyoung",
        email: "joelmooyoung@me.com",
        password: hashedPassword,
        type: "admin",
        active: true,
        loginCount: 0,
        createdAt: new Date(),
        lastLogin: null,
      },
    ];

    const results = [];

    for (const adminData of adminUsers) {
      try {
        // Delete existing user if exists
        await User.deleteOne({ email: adminData.email });
        console.log(
          `[FORCE CREATE ADMIN] Deleted existing user: ${adminData.email}`,
        );

        // Create new user
        const newUser = new User(adminData);
        await newUser.save();

        console.log(
          `[FORCE CREATE ADMIN] ✅ Created admin user: ${adminData.email}`,
        );

        results.push({
          email: adminData.email,
          username: adminData.username,
          type: adminData.type,
          active: adminData.active,
          status: "created",
        });
      } catch (userError) {
        console.error(
          `[FORCE CREATE ADMIN] Failed to create ${adminData.email}:`,
          userError,
        );
        results.push({
          email: adminData.email,
          status: "failed",
          error: userError.message,
        });
      }
    }

    // Test the created users by attempting login
    const testResults = [];
    for (const adminData of adminUsers) {
      try {
        const user = await User.findOne({ email: adminData.email });
        if (user) {
          const isValidPassword = await bcrypt.compare(
            adminPassword,
            user.password,
          );
          testResults.push({
            email: adminData.email,
            exists: true,
            passwordValid: isValidPassword,
            active: user.active,
          });
        } else {
          testResults.push({
            email: adminData.email,
            exists: false,
            passwordValid: false,
            active: false,
          });
        }
      } catch (testError) {
        testResults.push({
          email: adminData.email,
          exists: false,
          passwordValid: false,
          active: false,
          error: testError.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Admin users force-created successfully",
      adminPassword: adminPassword,
      createdUsers: results,
      testResults: testResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[FORCE CREATE ADMIN] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to force-create admin users",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
