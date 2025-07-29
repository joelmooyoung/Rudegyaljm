import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/mongodb.js";
import { User } from "../models/index.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectToDatabase();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@nocturne.com" });
    if (existingAdmin) {
      return res.status(200).json({
        success: true,
        message: "Admin user already exists",
        user: {
          email: existingAdmin.email,
          username: existingAdmin.username,
          role: existingAdmin.type,
        },
      });
    }

    // Create admin user
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash("admin123", saltRounds);

    const adminUser = new User({
      userId: "admin_" + Date.now(),
      username: "admin",
      email: "admin@nocturne.com",
      password: hashedPassword,
      type: "admin",
      country: "Unknown",
      active: true,
      loginCount: 0,
    });

    await adminUser.save();

    return res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      user: {
        email: adminUser.email,
        username: adminUser.username,
        role: adminUser.type,
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create admin user",
      error: error.message,
    });
  }
}
