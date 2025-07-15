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
        return await handleGetComments(req, res, storyId);
      case "POST":
        return await handleCreateComment(req, res, storyId);
      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed`,
        });
    }
  } catch (error) {
    console.error(`[COMMENTS API] Error:`, error);

    // Log error to database
    try {
      await db.logError({
        error_type: "COMMENTS_API_ERROR",
        error_message: error.message,
        stack_trace: error.stack,
        request_path: `/api/stories/${storyId}/comments`,
      });
    } catch (logError) {
      console.error(`[COMMENTS API] Failed to log error:`, logError);
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

async function handleGetComments(req, res, storyId) {
  console.log(`[COMMENTS API] Fetching comments for story ${storyId}`);

  const comments = await db.getComments(storyId);

  console.log(`[COMMENTS API] Found ${comments.length} comments`);

  return res.status(200).json({
    success: true,
    data: comments,
    count: comments.length,
    timestamp: new Date().toISOString(),
  });
}

async function handleCreateComment(req, res, storyId) {
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

  const commentData = {
    story_id: storyId,
    user_id: req.body.userId || "anonymous",
    username: req.body.username || "Anonymous",
    comment: commentText,
  };

  const newComment = await db.createComment(commentData);

  console.log(
    `[COMMENTS API] ✅ Added comment ${newComment.id} to story ${storyId}`,
  );

  return res.status(201).json({
    success: true,
    message: "Comment added successfully",
    data: newComment,
    timestamp: new Date().toISOString(),
  });
}
