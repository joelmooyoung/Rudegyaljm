import { connectToDatabase } from "../lib/mongodb.js";
import { Comment, Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[COMMENTS API] ${req.method} /api/comments`);
  console.log(`[COMMENTS API] Query:`, req.query);
  console.log(`[COMMENTS API] Body:`, req.body);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    if (req.method === "GET") {
      // Get all comments or comments for a specific story
      const { storyId } = req.query;

      let comments;
      if (storyId) {
        // Get comments for specific story
        comments = await Comment.find({ storyId }).sort({ createdAt: -1 });
        console.log(
          `[COMMENTS API] Found ${comments.length} comments for story ${storyId}`,
        );
      } else {
        // Get all comments
        comments = await Comment.find({}).sort({ createdAt: -1 });
        console.log(`[COMMENTS API] Found ${comments.length} total comments`);
      }

      return res.status(200).json({
        success: true,
        data: comments,
        count: comments.length,
      });
    }

    if (req.method === "POST") {
      // Create new comment
      const { storyId, content, userId, username } = req.body;

      if (!storyId || !content || !userId || !username) {
        return res.status(400).json({
          success: false,
          message: "storyId, content, userId, and username are required",
        });
      }

      // Verify story exists
      const story = await Story.findOne({ storyId });
      if (!story) {
        return res.status(404).json({
          success: false,
          message: "Story not found",
        });
      }

      // Create comment
      const commentId = Date.now().toString();
      const newComment = new Comment({
        commentId,
        storyId,
        userId,
        username,
        comment: content,
      });

      await newComment.save();
      console.log(
        `[COMMENTS API] ✅ Created comment ${commentId} for story ${storyId}`,
      );

      return res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data: {
          commentId: newComment.commentId,
          storyId: newComment.storyId,
          userId: newComment.userId,
          username: newComment.username,
          comment: newComment.comment,
          createdAt: newComment.createdAt,
        },
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error(`[COMMENTS API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
