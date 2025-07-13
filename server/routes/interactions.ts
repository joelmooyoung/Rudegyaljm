import { RequestHandler } from "express";
import { Comment, Rating } from "@shared/api";

// Mock database storage (replace with real database in production)
let comments: Comment[] = [];
let ratings: Rating[] = [];
let likes: { userId: string; storyId: string; createdAt: Date }[] = [];

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

// GET /api/stories/:id/comments - Get comments for a story
export const getStoryComments: RequestHandler = (req, res) => {
  try {
    const { id: storyId } = req.params;
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

    comments.push(newComment);
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

    const userRating = ratings.find(
      (rating) => rating.storyId === storyId && rating.userId === userId,
    );

    const userLike = likes.find(
      (like) => like.storyId === storyId && like.userId === userId,
    );

    res.json({
      rating: userRating?.score || 0,
      liked: !!userLike,
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

// GET /api/stories/:id/stats - Get story statistics
export const getStoryStats: RequestHandler = (req, res) => {
  try {
    const { id: storyId } = req.params;

    const storyRatings = ratings.filter((rating) => rating.storyId === storyId);
    const storyLikes = likes.filter((like) => like.storyId === storyId);
    const storyComments = comments.filter(
      (comment) => comment.storyId === storyId,
    );

    const averageRating =
      storyRatings.length > 0
        ? storyRatings.reduce((sum, rating) => sum + rating.score, 0) /
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
