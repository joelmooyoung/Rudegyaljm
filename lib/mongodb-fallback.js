// MongoDB connection with fallback for environments without database access

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn("🔶 No MONGODB_URI found - running in fallback mode");
    // Return a mock connection that won't crash
    return {
      isConnected: false,
      fallbackMode: true,
      message: "No database connection - using fallback mode",
    };
  }

  try {
    // Import mongoose only if we have a connection string
    const mongoose = await import("mongoose");

    if (mongoose.connection.readyState === 1) {
      return {
        isConnected: true,
        message: "Already connected to MongoDB",
      };
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    return {
      isConnected: true,
      message: "Connected to MongoDB successfully",
    };
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    return {
      isConnected: false,
      error: error.message,
      fallbackMode: true,
    };
  }
}

// Mock data for development environments without database
export const fallbackData = {
  users: [
    {
      id: "dev-admin-1",
      email: "admin@dev.com",
      username: "DevAdmin",
      role: "admin",
      type: "admin",
      active: true,
      loginCount: 0,
    },
  ],
  stories: [
    {
      id: "dev-story-1",
      title: "Sample Story (Development)",
      content: "This is a sample story for development environment...",
      author: "Dev Author",
      category: "Sample",
      tags: ["development", "sample"],
      published: true,
      views: 0,
      averageRating: 0,
      ratingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

export function useFallbackData(dataType) {
  return fallbackData[dataType] || [];
}
