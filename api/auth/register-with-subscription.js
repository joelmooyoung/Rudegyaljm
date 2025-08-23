import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";
import { triggerUserCacheInvalidation } from "../../lib/cache-manager.js";

// Password validation
const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const saltRounds = 12;

export default async function handler(req, res) {
  console.log(
    `[REGISTER WITH SUBSCRIPTION] ${req.method} /api/auth/register-with-subscription`,
  );

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const {
      email,
      username,
      password,
      dateOfBirth,
      subscriptionPlan,
      subscriptionType,
      paymentMethod,
    } = req.body;

    console.log(
      `[REGISTER WITH SUBSCRIPTION] Processing registration for: ${email}`,
    );
    console.log(
      `[REGISTER WITH SUBSCRIPTION] Subscription plan: ${subscriptionPlan}`,
    );
    console.log(
      `[REGISTER WITH SUBSCRIPTION] Has payment method: ${!!paymentMethod}`,
    );

    // Validate required fields
    if (!email || !username || !password || !dateOfBirth || !subscriptionPlan) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet requirements",
        errors: passwordValidation.errors,
      });
    }

    // Validate age
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: "You must be 18 or older to register",
      });
    }

    // Try database first, then fallback to local users
    try {
      await connectToDatabase();
      console.log("[REGISTER WITH SUBSCRIPTION] Database connected");

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      });

      if (existingUser) {
        const field =
          existingUser.email === email.toLowerCase() ? "email" : "username";
        return res.status(400).json({
          success: false,
          message: `User with this ${field} already exists`,
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Determine user type based on subscription
      let userType = "free";
      let subscriptionStatus = "none";

      if (subscriptionType === "premium") {
        userType = "premium";
        subscriptionStatus = "active";
      } else if (subscriptionType === "vip") {
        userType = "vip";
        subscriptionStatus = "active";
      }

      // Create user object
      const userData = {
        userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        type: userType,
        active: true,
        loginCount: 0,
        createdAt: new Date(),
        dateOfBirth: birth,
        subscriptionPlan: subscriptionPlan,
        subscriptionStatus: subscriptionStatus,
        subscriptionStartDate:
          subscriptionType !== "free" ? new Date() : undefined,
        paymentMethod: paymentMethod
          ? {
              type: paymentMethod.type,
              last4: paymentMethod.cardLast4,
              paymentIntentId: paymentMethod.paymentIntentId,
              timestamp: paymentMethod.timestamp,
            }
          : undefined,
      };

      // Create user in database
      const newUser = new User(userData);
      await newUser.save();

      console.log(
        `[REGISTER WITH SUBSCRIPTION] ✅ User created in database: ${email}`,
      );

      // Invalidate user and stats caches
      await triggerUserCacheInvalidation();
      console.log(`[REGISTER WITH SUBSCRIPTION] 🗑️ Cache invalidated for new user registration`);

      // Generate token
      const token = `reg_token_${userData.userId}_${Date.now()}`;

      // Log subscription details
      if (paymentMethod) {
        console.log(`[REGISTER WITH SUBSCRIPTION] 💳 Payment processed:`, {
          paymentIntentId: paymentMethod.paymentIntentId,
          amount: paymentMethod.amount,
          plan: subscriptionPlan,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Registration successful",
        token: token,
        user: {
          id: userData.userId,
          email: userData.email,
          username: userData.username,
          role: userData.type,
          isActive: userData.active,
          isAgeVerified: true,
          subscriptionStatus: userData.subscriptionStatus,
          subscriptionPlan: userData.subscriptionPlan,
          createdAt: userData.createdAt,
        },
      });
    } catch (dbError) {
      console.error(
        "[REGISTER WITH SUBSCRIPTION] Database failed, trying local users:",
        dbError.message,
      );

      // Fallback to local users
      try {
        const { createUser, initializeLocalUsers, getUserByEmail } =
          await import("../../lib/local-users.js");

        await initializeLocalUsers();

        // Check if user already exists in local storage
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "User with this email already exists",
          });
        }

        // Determine user type based on subscription
        let userType = "free";
        if (subscriptionType === "premium") {
          userType = "premium";
        } else if (subscriptionType === "vip") {
          userType = "vip";
        }

        // Create user data for local storage
        const userData = {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          password: password, // createUser will hash this
          type: userType,
          active: true,
          subscriptionPlan: subscriptionPlan,
          subscriptionStatus: subscriptionType !== "free" ? "active" : "none",
          paymentMethod: paymentMethod,
        };

        const createdUser = await createUser(userData);

        console.log(
          `[REGISTER WITH SUBSCRIPTION] ✅ User created in local storage: ${email}`,
        );

        // Generate token
        const token = `local_reg_token_${createdUser.id}_${Date.now()}`;

        return res.status(201).json({
          success: true,
          message: "Registration successful (local)",
          token: token,
          user: {
            id: createdUser.id,
            email: createdUser.email,
            username: createdUser.username,
            role: createdUser.type,
            isActive: createdUser.active,
            isAgeVerified: true,
            subscriptionStatus: userData.subscriptionStatus,
            subscriptionPlan: userData.subscriptionPlan,
            createdAt: createdUser.createdAt,
          },
        });
      } catch (localError) {
        console.error(
          "[REGISTER WITH SUBSCRIPTION] Local user creation failed:",
          localError.message,
        );
        throw new Error(
          "Registration failed - database and local storage unavailable",
        );
      }
    }
  } catch (error) {
    console.error("[REGISTER WITH SUBSCRIPTION] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
}
