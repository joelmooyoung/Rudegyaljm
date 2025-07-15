// Story comments API with MongoDB integration
import { connectToDatabase } from "../../../lib/mongodb.js";
import { Comment } from "../../../models/index.js";

export default async function handler(req, res) {
  const { id: storyId } = req.query;

  console.log(`[COMMENTS API] ${req.method} /api/stories/${storyId}/comments`);
  console.log(`[COMMENTS API] Body:`, req.body);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    switch (req.method) {
      case "GET":
        // Get all comments for a story
        console.log(`[COMMENTS API] Fetching comments for story ${storyId}`);

        const comments = await Comment.find({ storyId })
          .sort({ createdAt: -1 })
          .select("-__v");

        // Transform to expected format
        const transformedComments = comments.map((comment) => ({
          id: comment.commentId,
          storyId: comment.storyId,
          userId: comment.userId,
          username: comment.username,
          comment: comment.comment,
          createdAt: comment.createdAt.toISOString(),
        }));

        console.log(
          `[COMMENTS API] Found ${transformedComments.length} comments`,
        );

        return res.status(200).json({
          success: true,
          data: transformedComments,
          count: transformedComments.length,
          timestamp: new Date().toISOString(),
        });

      case "POST":
        // Add new comment
        console.log(`[COMMENTS API] Adding comment to story ${storyId}`);
        console.log(`[COMMENTS API] Request body:`, req.body);

        // Accept either 'comment' or 'content' field for frontend compatibility
        const commentText = req.body.comment || req.body.content;

        if (!req.body || !commentText) {
          console.log(`[COMMENTS API] Error: Missing comment text`);
          console.log(`[COMMENTS API] Received:`, {
            comment: req.body.comment,
            content: req.body.content,
          });
          return res.status(400).json({
            success: false,
            message: "Comment text is required (comment or content field)",
            received: req.body,
          });
        }

        const commentId = Date.now().toString();
        const newComment = new Comment({
          commentId,
          storyId,
          userId: req.body.userId || "anonymous",
          username: req.body.username || "Anonymous",
          comment: commentText,
        });

        await newComment.save();
        console.log(
          `[COMMENTS API] ✅ Added comment ${commentId} to story ${storyId}`,
        );

        return res.status(201).json({
          success: true,
          message: "Comment added successfully",
          data: {
            id: newComment.commentId,
            storyId: newComment.storyId,
            userId: newComment.userId,
            username: newComment.username,
            comment: newComment.comment,
            createdAt: newComment.createdAt.toISOString(),
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[COMMENTS API] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
