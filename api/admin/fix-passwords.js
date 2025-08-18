import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const USERS_FILE = path.join(process.cwd(), "data", "users.json");
    
    // Read current users
    const data = await fs.readFile(USERS_FILE, "utf-8");
    const users = JSON.parse(data);
    
    // Update passwords with correct hash for Admin123
    const saltRounds = 12;
    
    for (const user of users) {
      if (user.email === "admin@rudegyalconfessions.com" || user.email === "joelmooyoung@me.com") {
        user.password = await bcrypt.hash("Admin123", saltRounds);
        user.updatedAt = new Date();
        console.log(`Updated password for ${user.email}`);
      }
    }
    
    // Write back to file
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    
    return res.json({ 
      success: true, 
      message: "Passwords updated successfully",
      updatedUsers: users.filter(u => u.email === "admin@rudegyalconfessions.com" || u.email === "joelmooyoung@me.com").map(u => ({ email: u.email, updated: true }))
    });
    
  } catch (error) {
    console.error("Error updating passwords:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to update passwords",
      error: error.message 
    });
  }
}
