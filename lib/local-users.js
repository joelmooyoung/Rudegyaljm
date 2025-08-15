// Local user storage system for when MongoDB is unavailable
import bcrypt from "bcryptjs";
import fs from 'fs/promises';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Default users with role-based passwords
const DEFAULT_USERS = [
  {
    id: "admin-001",
    email: "admin@rudegyalconfessions.com",
    username: "admin",
    password: "admin123", // Will be hashed
    type: "admin",
    active: true,
    createdAt: new Date("2024-01-01"),
    lastLogin: null,
    loginCount: 0
  },
  {
    id: "joel-001", 
    email: "joelmooyoung@me.com",
    username: "joelmooyoung",
    password: "admin123", // Will be hashed
    type: "admin", 
    active: true,
    createdAt: new Date("2024-01-01"),
    lastLogin: null,
    loginCount: 0
  }
];

// Initialize users file with defaults if it doesn't exist
export async function initializeLocalUsers() {
  try {
    await ensureDataDir();
    
    // Check if users file exists
    try {
      await fs.access(USERS_FILE);
      console.log("[LOCAL USERS] Users file exists");
      return;
    } catch {
      console.log("[LOCAL USERS] Creating users file with defaults");
    }
    
    // Hash passwords for default users
    const saltRounds = 12;
    const hashedUsers = await Promise.all(
      DEFAULT_USERS.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, saltRounds)
      }))
    );
    
    await fs.writeFile(USERS_FILE, JSON.stringify(hashedUsers, null, 2));
    console.log("[LOCAL USERS] ✅ Initialized with default users");
  } catch (error) {
    console.error("[LOCAL USERS] ❌ Failed to initialize:", error);
    throw error;
  }
}

// Get all users
export async function getAllUsers() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log("[LOCAL USERS] No users file found, returning empty array");
    return [];
  }
}

// Get user by email
export async function getUserByEmail(email) {
  const users = await getAllUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

// Create user
export async function createUser(userData) {
  const users = await getAllUsers();
  
  // Check if user already exists
  if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
    throw new Error("User already exists");
  }
  
  const saltRounds = 12;
  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: userData.email,
    username: userData.username,
    password: await bcrypt.hash(userData.password, saltRounds),
    type: userData.type || "free",
    active: userData.active !== false,
    createdAt: new Date(),
    lastLogin: null,
    loginCount: 0
  };
  
  users.push(newUser);
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  
  return newUser;
}

// Update user
export async function updateUser(email, updates) {
  const users = await getAllUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (userIndex === -1) {
    throw new Error("User not found");
  }
  
  // Hash password if being updated
  if (updates.password) {
    const saltRounds = 12;
    updates.password = await bcrypt.hash(updates.password, saltRounds);
  }
  
  users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date() };
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  
  return users[userIndex];
}

// Authenticate user
export async function authenticateUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user || !user.active) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }
  
  // Update last login
  await updateUser(email, {
    lastLogin: new Date(),
    loginCount: (user.loginCount || 0) + 1
  });
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Reset all passwords to role-based defaults
export async function resetAllPasswords() {
  const users = await getAllUsers();
  const saltRounds = 12;
  const updatedUsers = [];
  
  for (const user of users) {
    let newPassword;
    switch (user.type) {
      case 'admin':
        newPassword = 'admin123';
        break;
      case 'premium':
        newPassword = 'premium123';
        break;
      case 'free':
      default:
        newPassword = 'free123';
        break;
    }
    
    user.password = await bcrypt.hash(newPassword, saltRounds);
    user.active = true; // Ensure user is active
    user.updatedAt = new Date();
    
    updatedUsers.push({
      email: user.email,
      newPassword: newPassword,
      accessLevel: user.type || 'free'
    });
  }
  
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  
  return updatedUsers;
}
