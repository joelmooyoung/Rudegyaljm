import { connectToDatabase } from "../lib/mongodb.js";
import bcrypt from "bcryptjs";
import { User, Story, LoginLog, Comment } from "../models/index.js";

export default async function handler(req, res) {
  // ENDPOINT DISABLED: This endpoint was wiping all user data including real accounts
  // It deleted the user joelmooyoung@me.com and other real users, replacing them with test data
  
  return res.status(503).json({ 
    success: false,
    message: "Database seeding endpoint is DISABLED to prevent accidental data loss.",
    issue: "This endpoint was deleting real user accounts (including joelmooyoung@me.com) and replacing them with test users (admin@nocturne.com, premium@test.com, free@test.com).",
    impact: "Users logging in as their real accounts were seeing test user data instead.",
    solution: "Use development-specific seeding scripts that don't affect production data."
  });

  // THE ORIGINAL SEEDING CODE HAS BEEN DISABLED TO PROTECT USER DATA
  // If you need to seed development data, create a separate development-only endpoint
  // or use local seeding scripts that don't run in production environments
}
