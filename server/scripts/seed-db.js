const { execSync } = require("child_process");

// Set environment variable to enable seeding
process.env.SEED_DB = "true";

// Run the TypeScript seed script
try {
  console.log("🌱 Starting database seeding...");
  execSync("npx tsx server/scripts/seed.ts", { stdio: "inherit" });
  console.log("✅ Database seeding completed!");
} catch (error) {
  console.error("❌ Database seeding failed:", error.message);
  process.exit(1);
}
