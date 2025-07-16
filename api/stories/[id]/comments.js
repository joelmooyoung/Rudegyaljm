import { db } from "../../../lib/supabase.js";

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
    switch (req.method) {
      case "GET":
        // Get all comments for a story
        console.log(`[COMMENTS API] Fetching comments for story ${storyId}`);

        const comments = await db.getComments(storyId);

        // Transform to expected format
        const transformedComments = comments.map((comment) => ({
          id: comment.id,
          storyId: comment.story_id,
          userId: comment.user_id,
          username: comment.username,
          comment: comment.comment,
          createdAt: comment.created_at,
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

        const newComment = await db.createComment({
          story_id: storyId,
          user_id: req.body.userId || "anonymous",
          username: req.body.username || "Anonymous",
          comment: commentText,
        });

        console.log(
          `[COMMENTS API] ✅ Added comment ${newComment.id} to story ${storyId}`,
        );

        return res.status(201).json({
          success: true,
          message: "Comment added successfully",
          data: {
            id: newComment.id,
            storyId: newComment.story_id,
            userId: newComment.user_id,
            username: newComment.username,
            comment: newComment.comment,
            createdAt: newComment.created_at,
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
