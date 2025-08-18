import fs from "fs/promises";
import path from "path";

const STATS_FILE = path.join(process.cwd(), "data", "story-stats.json");

// Initialize stats storage
export async function initializeStatsStorage() {
  try {
    await fs.access(STATS_FILE);
  } catch (error) {
    // File doesn't exist, create it
    await fs.mkdir(path.dirname(STATS_FILE), { recursive: true });
    await fs.writeFile(STATS_FILE, JSON.stringify({}));
    console.log("[STORY STATS] Initialized stats storage");
  }
}

// Get all stats
export async function getAllStats() {
  try {
    await initializeStatsStorage();
    const data = await fs.readFile(STATS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("[STORY STATS] Error reading stats:", error);
    return {};
  }
}

// Get stats for a specific story
export async function getStoryStats(storyId) {
  try {
    const allStats = await getAllStats();
    return allStats[storyId] || {
      viewCount: 0,
      likeCount: 0,
      rating: 0,
      ratingCount: 0,
      commentCount: 0,
      likes: [], // Array of user IDs who liked
      ratings: [], // Array of rating objects { userId, rating }
      views: [], // Array of view objects { userId, timestamp }
    };
  } catch (error) {
    console.error("[STORY STATS] Error getting story stats:", error);
    return {
      viewCount: 0,
      likeCount: 0,
      rating: 0,
      ratingCount: 0,
      commentCount: 0,
      likes: [],
      ratings: [],
      views: [],
    };
  }
}

// Update story stats
export async function updateStoryStats(storyId, updates) {
  try {
    const allStats = await getAllStats();
    const currentStats = allStats[storyId] || {
      viewCount: 0,
      likeCount: 0,
      rating: 0,
      ratingCount: 0,
      commentCount: 0,
      likes: [],
      ratings: [],
      views: [],
    };

    // Merge updates
    const updatedStats = { ...currentStats, ...updates };

    // Recalculate derived values
    updatedStats.likeCount = updatedStats.likes.length;
    updatedStats.ratingCount = updatedStats.ratings.length;
    updatedStats.viewCount = updatedStats.views.length;

    // Calculate average rating
    if (updatedStats.ratings.length > 0) {
      const totalRating = updatedStats.ratings.reduce((sum, r) => sum + r.rating, 0);
      updatedStats.rating = Number((totalRating / updatedStats.ratings.length).toFixed(1));
    } else {
      updatedStats.rating = 0;
    }

    // Update storage
    allStats[storyId] = updatedStats;
    await fs.writeFile(STATS_FILE, JSON.stringify(allStats, null, 2));

    console.log(`[STORY STATS] Updated stats for story ${storyId}:`, {
      views: updatedStats.viewCount,
      likes: updatedStats.likeCount,
      rating: updatedStats.rating,
      comments: updatedStats.commentCount,
    });

    return updatedStats;
  } catch (error) {
    console.error("[STORY STATS] Error updating stats:", error);
    throw error;
  }
}

// Record a view
export async function recordView(storyId, userId, sessionId = null) {
  try {
    const stats = await getStoryStats(storyId);
    const viewId = userId || sessionId || `anon_${Date.now()}_${Math.random()}`;
    
    // Check if this user/session already viewed (prevent duplicate views in same session)
    const existingView = stats.views.find(v => 
      v.userId === viewId || 
      (v.sessionId && v.sessionId === sessionId) ||
      // Prevent duplicate views within 1 hour
      (v.userId === userId && Date.now() - new Date(v.timestamp).getTime() < 3600000)
    );

    if (!existingView) {
      stats.views.push({
        userId: userId,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        ip: null, // Could be added if needed
      });

      return await updateStoryStats(storyId, stats);
    }

    return stats;
  } catch (error) {
    console.error("[STORY STATS] Error recording view:", error);
    throw error;
  }
}

// Record a like/unlike
export async function recordLike(storyId, userId, action = "like") {
  try {
    const stats = await getStoryStats(storyId);
    
    if (action === "like") {
      // Add like if not already liked
      if (!stats.likes.includes(userId)) {
        stats.likes.push(userId);
      }
    } else if (action === "unlike") {
      // Remove like
      stats.likes = stats.likes.filter(id => id !== userId);
    }

    return await updateStoryStats(storyId, stats);
  } catch (error) {
    console.error("[STORY STATS] Error recording like:", error);
    throw error;
  }
}

// Record a rating
export async function recordRating(storyId, userId, rating) {
  try {
    const stats = await getStoryStats(storyId);
    
    // Remove existing rating from this user
    stats.ratings = stats.ratings.filter(r => r.userId !== userId);
    
    // Add new rating
    if (rating > 0) {
      stats.ratings.push({
        userId: userId,
        rating: rating,
        timestamp: new Date().toISOString(),
      });
    }

    return await updateStoryStats(storyId, stats);
  } catch (error) {
    console.error("[STORY STATS] Error recording rating:", error);
    throw error;
  }
}

// Increment comment count
export async function incrementCommentCount(storyId) {
  try {
    const stats = await getStoryStats(storyId);
    stats.commentCount += 1;
    return await updateStoryStats(storyId, stats);
  } catch (error) {
    console.error("[STORY STATS] Error incrementing comment count:", error);
    throw error;
  }
}

// Decrement comment count
export async function decrementCommentCount(storyId) {
  try {
    const stats = await getStoryStats(storyId);
    stats.commentCount = Math.max(0, stats.commentCount - 1);
    return await updateStoryStats(storyId, stats);
  } catch (error) {
    console.error("[STORY STATS] Error decrementing comment count:", error);
    throw error;
  }
}

// Get user interaction status with a story
export async function getUserInteractionStatus(storyId, userId) {
  try {
    const stats = await getStoryStats(storyId);
    const hasLiked = stats.likes.includes(userId);
    const userRating = stats.ratings.find(r => r.userId === userId);
    const hasViewed = stats.views.some(v => v.userId === userId);

    return {
      hasLiked,
      userRating: userRating ? userRating.rating : 0,
      hasViewed,
    };
  } catch (error) {
    console.error("[STORY STATS] Error getting user interaction status:", error);
    return {
      hasLiked: false,
      userRating: 0,
      hasViewed: false,
    };
  }
}

// Bulk update stats from database (for migration)
export async function migrateStatsFromDatabase(stories) {
  try {
    const allStats = await getAllStats();
    let updated = false;

    for (const story of stories) {
      if (story.id && !allStats[story.id]) {
        allStats[story.id] = {
          viewCount: story.viewCount || 0,
          likeCount: 0,
          rating: story.rating || 0,
          ratingCount: story.ratingCount || 0,
          commentCount: 0,
          likes: [],
          ratings: story.ratingCount > 0 ? [
            { userId: "migrated", rating: story.rating || 0, timestamp: new Date().toISOString() }
          ] : [],
          views: [],
        };
        updated = true;
      }
    }

    if (updated) {
      await fs.writeFile(STATS_FILE, JSON.stringify(allStats, null, 2));
      console.log("[STORY STATS] Migrated stats from database");
    }

    return allStats;
  } catch (error) {
    console.error("[STORY STATS] Error migrating stats:", error);
    return {};
  }
}
