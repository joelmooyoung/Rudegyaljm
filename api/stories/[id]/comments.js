// Story comments API - handle adding and fetching comments
let comments = [
  {
    id: "1",
    storyId: "1",
    userId: "admin1",
    username: "admin",
    comment: "This is an amazing story! The passion really comes through.",
    createdAt: "2024-01-16T00:00:00.000Z",
  },
  {
    id: "2",
    storyId: "1",
    userId: "premium1",
    username: "premiumuser",
    comment: "Absolutely captivating. Looking forward to more like this.",
    createdAt: "2024-01-17T00:00:00.000Z",
  },
  {
    id: "3",
    storyId: "2",
    userId: "free1",
    username: "freeuser",
    comment: "The tension in this story is incredible!",
    createdAt: "2024-01-21T00:00:00.000Z",
  },
];

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
        const storyComments = comments.filter((c) => c.storyId === storyId);
        console.log(`[COMMENTS API] Found ${storyComments.length} comments`);

        return res.status(200).json({
          success: true,
          data: storyComments,
          count: storyComments.length,
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

        const newComment = {
          id: Date.now().toString(),
          storyId: storyId,
          userId: req.body.userId || "anonymous",
          username: req.body.username || "Anonymous",
          comment: commentText,
          createdAt: new Date().toISOString(),
        };

        comments.push(newComment);
        console.log(
          `[COMMENTS API] ✅ Added comment ${newComment.id} to story ${storyId}`,
        );

        return res.status(201).json({
          success: true,
          message: "Comment added successfully",
          data: newComment,
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
