import { connectToDatabase } from "../../lib/mongodb.js";
import { Comment } from "../../models/index.js";

export default async function handler(req, res) {
  const { id: commentId } = req.query;

  console.log(`[COMMENT DELETE] ${req.method} /api/comments/${commentId}`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    if (req.method === "DELETE") {
      console.log(`[COMMENT DELETE] Deleting comment: ${commentId}`);

      // Find and delete the comment
      const deletedComment = await Comment.findOneAndDelete({
        commentId: commentId,
      });

      if (!deletedComment) {
        console.log(`[COMMENT DELETE] Comment not found: ${commentId}`);
        return res.status(404).json({
          success: false,
          message: `Comment not found: ${commentId}`,
        });
      }

      console.log(`[COMMENT DELETE] ✅ Deleted comment: ${commentId}`);

      return res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
        data: {
          commentId: deletedComment.commentId,
          storyId: deletedComment.storyId,
          username: deletedComment.username,
        },
      });
    }

    if (req.method === "GET") {
      // Get single comment
      const comment = await Comment.findOne({ commentId });

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: comment,
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error(`[COMMENT DELETE] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
