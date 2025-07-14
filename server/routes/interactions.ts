import { RequestHandler } from "express";
import { Comment, Rating } from "@shared/api";
import { loadStories, saveStories } from "../utils/dataStore";
import {
  loadComments,
  saveComments,
  loadInteractions,
  saveInteractions,
} from "../utils/dataStore";

// Load data from JSON files
let comments: Comment[] = loadComments();
let interactions = loadInteractions();

// Convert stored interactions to runtime format
let likes: { userId: string; storyId: string; createdAt: Date }[] =
  Object.entries(interactions.likes).flatMap(([storyId, users]) =>
    Object.entries(users)
      .map(([userId, liked]) =>
        liked ? { userId, storyId, createdAt: new Date() } : null,
      )
      .filter(Boolean),
  ) as { userId: string; storyId: string; createdAt: Date }[];

let ratings: Rating[] = Object.entries(interactions.ratings).flatMap(
  ([storyId, users]) =>
    Object.entries(users).map(([userId, score]) => ({
      id: `${storyId}-${userId}`,
      storyId,
      userId,
      score,
      createdAt: new Date(),
    })),
);

// Helper function to log errors
const logError = (
  error: string,
  req: any,
  severity: "low" | "medium" | "high" | "critical" = "medium",
): void => {
  console.error(
    `[${severity.toUpperCase()}] ${req.method} ${req.originalUrl}: ${error}`,
  );
};

// Helper function to save interactions to JSON
const saveInteractionsData = () => {
  const interactionsData = {
    likes: {} as { [storyId: string]: { [userId: string]: boolean } },
    ratings: {} as { [storyId: string]: { [userId: string]: number } },
  };

  // Convert likes array to object format
  likes.forEach((like) => {
    if (!interactionsData.likes[like.storyId]) {
      interactionsData.likes[like.storyId] = {};
    }
    interactionsData.likes[like.storyId][like.userId] = true;
  });

  // Convert ratings array to object format
  ratings.forEach((rating) => {
    if (!interactionsData.ratings[rating.storyId]) {
      interactionsData.ratings[rating.storyId] = {};
    }
    interactionsData.ratings[rating.storyId][rating.userId] = rating.score;
  });

  saveInteractions(interactionsData);
};

// Helper function to update story statistics
const updateStoryStats = (storyId: string) => {
  const currentStories = loadStories();
  const storyIndex = currentStories.findIndex((s) => s.id === storyId);
  if (storyIndex === -1) return;

  // Update rating and rating count
  const storyRatings = ratings.filter((r) => r.storyId === storyId);
  if (storyRatings.length > 0) {
    const avgRating =
      storyRatings.reduce((sum, r) => sum + r.score, 0) / storyRatings.length;
    currentStories[storyIndex].rating = parseFloat(avgRating.toFixed(1));
    currentStories[storyIndex].ratingCount = storyRatings.length;
  }

  currentStories[storyIndex].updatedAt = new Date();
  saveStories(currentStories);
};

// Helper function to increment view count
const incrementViewCount = (storyId: string) => {
  const currentStories = loadStories();
  const storyIndex = currentStories.findIndex((s) => s.id === storyId);
  if (storyIndex !== -1) {
    currentStories[storyIndex].viewCount += 1;
    currentStories[storyIndex].updatedAt = new Date();
    saveStories(currentStories);
  }
};

// Helper function to update comment count
const updateCommentCount = (storyId: string) => {
  const currentStories = loadStories();
  const storyIndex = currentStories.findIndex((s) => s.id === storyId);
  if (storyIndex !== -1) {
    const storyComments = comments.filter((c) => c.storyId === storyId);
    currentStories[storyIndex].commentCount = storyComments.length;
    currentStories[storyIndex].updatedAt = new Date();
    saveStories(currentStories);
  }
};

// GET /api/stories/:id/comments - Get comments for a story
export const getStoryComments: RequestHandler = (req, res) => {
  try {
    const { id: storyId } = req.params;
    // Reload comments to get latest data
    comments = loadComments();
    const storyComments = comments
      .filter((comment) => comment.storyId === storyId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json(storyComments);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch comments";
    logError(`Error fetching comments: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/stories/:id/comments - Add comment to a story
export const addStoryComment: RequestHandler = (req, res) => {
  try {
    const { id: storyId } = req.params;
    const { content } = req.body;
    // In a real app, get user from authentication token
    const userId = req.body.userId || "anonymous";
    const username = req.body.username || "Anonymous";

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const newComment: Comment = {
      id: Date.now().toString(),
      storyId,
      userId,
      username,
      content: content.trim(),
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Reload comments, add new one, and save
    comments = loadComments();
    comments.push(newComment);
    saveComments(comments);

    // Update comment count in story
    updateCommentCount(storyId);

    res.status(201).json(newComment);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add comment";
    logError(`Error adding comment: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/stories/:id/rating - Rate a story
export const rateStory: RequestHandler = (req, res) => {
  try {
    const { id: storyId } = req.params;
    const { score } = req.body;
    // In a real app, get user from authentication token
    const userId = req.body.userId || "anonymous";

    if (!score || score < 1 || score > 5) {
      return res
        .status(400)
        .json({ message: "Rating score must be between 1 and 5" });
    }

    // Reload interactions data
    interactions = loadInteractions();

    // Convert to runtime format for consistency
    ratings = Object.entries(interactions.ratings).flatMap(([sId, users]) =>
      Object.entries(users).map(([uId, sc]) => ({
        id: `${sId}-${uId}`,
        storyId: sId,
        userId: uId,
        score: sc,
        createdAt: new Date(),
      })),
    );

    // Check if user already rated this story
    const existingRatingIndex = ratings.findIndex(
      (rating) => rating.storyId === storyId && rating.userId === userId,
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      ratings[existingRatingIndex].score = score;
      ratings[existingRatingIndex].createdAt = new Date();
      res.json(ratings[existingRatingIndex]);
    } else {
      // Create new rating
      const newRating: Rating = {
        id: Date.now().toString(),
        storyId,
        userId,
        score,
        createdAt: new Date(),
      };

      ratings.push(newRating);
      res.status(201).json(newRating);
    }

    // Save ratings and update story statistics
    saveInteractionsData();
    updateStoryStats(storyId);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to rate story";
    logError(`Error rating story: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/stories/:id/like - Toggle like for a story
export const toggleStoryLike: RequestHandler = (req, res) => {
  try {
    const { id: storyId } = req.params;
    // In a real app, get user from authentication token
    const userId = req.body.userId || "anonymous";

    // Reload interactions data
    interactions = loadInteractions();

    // Convert to runtime format
    likes = Object.entries(interactions.likes).flatMap(([sId, users]) =>
      Object.entries(users)
        .map(([uId, liked]) =>
          liked ? { userId: uId, storyId: sId, createdAt: new Date() } : null,
        )
        .filter(Boolean),
    ) as { userId: string; storyId: string; createdAt: Date }[];

    const existingLikeIndex = likes.findIndex(
      (like) => like.storyId === storyId && like.userId === userId,
    );

    if (existingLikeIndex !== -1) {
      // Remove like
      likes.splice(existingLikeIndex, 1);
      res.json({ liked: false, message: "Like removed" });
    } else {
      // Add like
      const newLike = {
        userId,
        storyId,
        createdAt: new Date(),
      };
      likes.push(newLike);
      res.json({ liked: true, message: "Story liked" });
    }

    // Save likes data
    saveInteractionsData();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to toggle like";
    logError(`Error toggling like: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/stories/:id/user-interaction - Get user's interaction with a story
export const getUserInteraction: RequestHandler = (req, res) => {
  try {
    const { id: storyId } = req.params;
    // In a real app, get user from authentication token
    const userId = req.body.userId || req.query.userId || "anonymous";

    // Reload interactions data
    interactions = loadInteractions();

    // Check user's rating
    const userRating = interactions.ratings[storyId]?.[userId] || 0;

    // Check user's like
    const userLike = interactions.likes[storyId]?.[userId] || false;

    res.json({
      rating: userRating,
      liked: userLike,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch user interaction";
    logError(`Error fetching user interaction: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/stories/:id/view - Increment view count
export const incrementStoryViews: RequestHandler = (req, res) => {
  try {
    const { id: storyId } = req.params;
    incrementViewCount(storyId);
    res.json({ success: true, message: "View count incremented" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to increment view count";
    logError(`Error incrementing view count: ${errorMessage}`, req, "medium");
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/stories/:id/stats - Get story statistics
export const getStoryStats: RequestHandler = (req, res) => {
  try {
    const { id: storyId } = req.params;

    // Reload data to get latest stats
    comments = loadComments();
    interactions = loadInteractions();

    const storyRatings = Object.values(interactions.ratings[storyId] || {});
    const storyLikes = Object.values(interactions.likes[storyId] || {}).filter(
      Boolean,
    );
    const storyComments = comments.filter(
      (comment) => comment.storyId === storyId,
    );

    const averageRating =
      storyRatings.length > 0
        ? storyRatings.reduce((sum, rating) => sum + rating, 0) /
          storyRatings.length
        : 0;

    res.json({
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings: storyRatings.length,
      totalLikes: storyLikes.length,
      totalComments: storyComments.length,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch story stats";
    logError(`Error fetching story stats: ${errorMessage}`, req, "high");
    res.status(500).json({ message: "Internal server error" });
  }
};
