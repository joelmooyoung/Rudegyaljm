import { db } from "../lib/supabase.js";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  console.log(`[DB TEST] Testing database connection and users`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Test 1: Basic connection
    console.log(`[DB TEST] Testing basic Supabase connection...`);
    const { data: testData, error: testError } = await db
      .getSupabaseAdmin()
      .from("users")
      .select("count", { count: "exact" });

    if (testError) {
      throw new Error(`Connection test failed: ${testError.message}`);
    }

    console.log(`[DB TEST] ✅ Connection successful, found users:`, testData);

    // Test 2: Check if test users exist
    console.log(`[DB TEST] Checking for test users...`);
    const { data: users, error: usersError } = await db
      .getSupabaseAdmin()
      .from("users")
      .select("*")
      .in("username", ["admin", "premiumuser", "freeuser"]);

    if (usersError) {
      throw new Error(`User fetch failed: ${usersError.message}`);
    }

    console.log(`[DB TEST] Found ${users.length} test users:`, users);

    // Test 3: Password validation for admin user
    const adminUser = users.find((u) => u.username === "admin");
    let passwordTest = null;

    if (adminUser) {
      try {
        const passwordMatch = await bcrypt.compare(
          "admin123",
          adminUser.password_hash,
        );
        passwordTest = {
          username: "admin",
          passwordValid: passwordMatch,
        };
        console.log(
          `[DB TEST] Admin password test: ${passwordMatch ? "✅ Valid" : "❌ Invalid"}`,
        );
      } catch (err) {
        passwordTest = {
          username: "admin",
          passwordValid: false,
          error: err.message,
        };
      }
    }

    // Test 4: Get sample stories
    console.log(`[DB TEST] Checking for sample stories...`);
    const { data: stories, error: storiesError } = await db
      .getSupabaseAdmin()
      .from("stories")
      .select("id, title, is_published")
      .limit(5);

    if (storiesError) {
      throw new Error(`Stories fetch failed: ${storiesError.message}`);
    }

    console.log(`[DB TEST] Found ${stories.length} stories:`, stories);

    // Test 5: Environment variables check
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    console.log(`[DB TEST] Environment variables:`, envCheck);

    return res.status(200).json({
      success: true,
      message: "Database test completed successfully",
      results: {
        connection: "✅ Connected",
        userCount: users.length,
        testUsers: users.map((u) => ({
          username: u.username,
          email: u.email,
          role: u.role,
          isActive: u.is_active,
        })),
        passwordTest,
        storyCount: stories.length,
        sampleStories: stories,
        environment: envCheck,
        recommendations: {
          ...(users.length === 0 && {
            missingUsers:
              "Run the schema.sql file in your Supabase SQL editor to create test users",
          }),
          ...(passwordTest &&
            !passwordTest.passwordValid && {
              passwordIssue:
                "Admin password hash doesn't match. Check bcrypt implementation.",
            }),
          ...(!envCheck.NEXT_PUBLIC_SUPABASE_URL && {
            missingEnv: "Set NEXT_PUBLIC_SUPABASE_URL environment variable",
          }),
          ...(!envCheck.SUPABASE_SERVICE_ROLE_KEY && {
            missingServiceKey:
              "Set SUPABASE_SERVICE_ROLE_KEY environment variable",
          }),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[DB TEST] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.message,
      recommendations: {
        checkEnvironment: "Verify SUPABASE environment variables are set",
        checkSchema: "Run the schema.sql file in your Supabase SQL editor",
        checkConnection: "Verify Supabase project URL and keys are correct",
      },
    });
  }
}
