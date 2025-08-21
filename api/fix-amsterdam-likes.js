import { connectToDatabase } from "../lib/mongodb.js";
import { Story, Like } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    
    const storyId = "1755540821501";
    
    // Get actual like records
    const likes = await Like.find({ storyId });
    const actualLikeCount = likes.length;
    
    // Force update the story's likeCount field
    const updateResult = await Story.findOneAndUpdate(
      { storyId },
      { $set: { likeCount: actualLikeCount } },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      message: `Fixed Amsterdam story like count`,
      storyId,
      actualLikeRecords: actualLikeCount,
      updatedStoryLikeCount: updateResult?.toObject()?.likeCount,
      fixed: true
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
