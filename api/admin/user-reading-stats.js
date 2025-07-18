import { connectToDatabase } from "../../lib/mongodb.js";
import { UserStoryRead, User } from "../../models/index.js";

export default async function handler(req, res) {
  console.log(
    `[ADMIN USER READING STATS] ${req.method} /api/admin/user-reading-stats`,
  );

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // Connect to MongoDB
    const dbConnection = await connectToDatabase();

    if (!dbConnection.isConnected) {
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable",
      });
    }

    const { userId, limit = 50, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    if (userId) {
      // Get detailed stats for a specific user
      return await getUserDetailedStats(req, res, userId);
    } else {
      // Get aggregated stats for all users
      return await getAllUsersReadingStats(req, res, limitNum, skip);
    }
  } catch (error) {
    console.error(`[ADMIN USER READING STATS] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function getUserDetailedStats(req, res, userId) {
  try {
    // Get user info
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get total reads for user
    const totalReads = await UserStoryRead.countDocuments({ userId });

    // Get unique stories read
    const uniqueStories = await UserStoryRead.distinct("storyId", { userId });
    const uniqueStoriesCount = uniqueStories.length;

    // Get all reads with details
    const allReads = await UserStoryRead.find({ userId })
      .sort({ timestamp: -1 })
      .select("storyId storyTitle timestamp");

    // Calculate reading streak
    let streak = 0;
    if (allReads.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const readDates = [
        ...new Set(
          allReads.map((read) => {
            const date = new Date(read.timestamp);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
          }),
        ),
      ].sort((a, b) => b - a);

      for (let i = 0; i < readDates.length; i++) {
        const expectedDate = new Date(
          today.getTime() - i * 24 * 60 * 60 * 1000,
        );
        if (readDates[i] === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Get reading activity by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await UserStoryRead.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get most read stories by this user
    const topStories = await UserStoryRead.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$storyId",
          storyTitle: { $first: "$storyTitle" },
          readCount: { $sum: 1 },
          lastRead: { $max: "$timestamp" },
        },
      },
      { $sort: { readCount: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          type: user.type,
        },
        stats: {
          totalReads,
          uniqueStoriesCount,
          readingStreak: streak,
          averageReadsPerDay:
            totalReads /
            Math.max(
              1,
              (Date.now() - new Date(user.createdAt).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
        },
        recentActivity,
        topStories,
        allReads: allReads.slice(0, 100), // Limit to recent 100 reads
      },
    });
  } catch (error) {
    console.error(
      `[ADMIN USER READING STATS] Error getting user details:`,
      error,
    );
    return res.status(500).json({
      success: false,
      message: "Failed to get user reading details",
      error: error.message,
    });
  }
}

async function getAllUsersReadingStats(req, res, limit, skip) {
  try {
    // Get aggregated reading stats for all users
    const userStats = await UserStoryRead.aggregate([
      {
        $group: {
          _id: "$userId",
          username: { $first: "$username" },
          totalReads: { $sum: 1 },
          uniqueStories: { $addToSet: "$storyId" },
          firstRead: { $min: "$timestamp" },
          lastRead: { $max: "$timestamp" },
        },
      },
      {
        $addFields: {
          uniqueStoriesCount: { $size: "$uniqueStories" },
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          totalReads: 1,
          uniqueStoriesCount: 1,
          firstRead: 1,
          lastRead: 1,
        },
      },
      { $sort: { totalReads: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Get total count for pagination
    const totalUsers = await UserStoryRead.distinct("userId").then(
      (arr) => arr.length,
    );

    // Get overall platform statistics
    const platformStats = await UserStoryRead.aggregate([
      {
        $group: {
          _id: null,
          totalReads: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
          uniqueStories: { $addToSet: "$storyId" },
        },
      },
      {
        $addFields: {
          uniqueUsersCount: { $size: "$uniqueUsers" },
          uniqueStoriesCount: { $size: "$uniqueStories" },
        },
      },
    ]);

    // Get reading activity for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyActivity = await UserStoryRead.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          totalReads: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
      {
        $addFields: {
          uniqueUsersCount: { $size: "$uniqueUsers" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: userStats,
        pagination: {
          page: Math.floor(skip / limit) + 1,
          limit,
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit),
        },
        platformStats: platformStats[0] || {
          totalReads: 0,
          uniqueUsersCount: 0,
          uniqueStoriesCount: 0,
        },
        weeklyActivity,
      },
    });
  } catch (error) {
    console.error(
      `[ADMIN USER READING STATS] Error getting all users stats:`,
      error,
    );
    return res.status(500).json({
      success: false,
      message: "Failed to get users reading statistics",
      error: error.message,
    });
  }
}
