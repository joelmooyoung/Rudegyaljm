import { connectToDatabase } from "../lib/mongodb.js";
import { Comment } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    // Get first few comments to check date formats
    const comments = await Comment.find({}).limit(3);

    const dateAnalysis = comments.map((comment) => {
      const createdAt = comment.createdAt;
      const updatedAt = comment.updatedAt;

      return {
        commentId: comment.commentId,
        rawCreatedAt: createdAt,
        rawUpdatedAt: updatedAt,
        createdAtType: typeof createdAt,
        updatedAtType: typeof updatedAt,
        createdAtString: String(createdAt),
        updatedAtString: String(updatedAt),
        parsedCreatedAt: {
          asDate: new Date(createdAt),
          isValid: !isNaN(new Date(createdAt).getTime()),
          timestamp: new Date(createdAt).getTime(),
        },
        parsedUpdatedAt: {
          asDate: new Date(updatedAt),
          isValid: !isNaN(new Date(updatedAt).getTime()),
          timestamp: new Date(updatedAt).getTime(),
        },
      };
    });

    return res.status(200).json({
      success: true,
      totalComments: await Comment.countDocuments(),
      dateAnalysis,
      sampleComment: comments[0] || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
