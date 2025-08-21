import { connectToDatabase } from "../lib/mongodb.js";
import { Story, Like } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    
    const storyId = "1755540821501";
    
    // Get story document
    const story = await Story.findOne({ storyId });
    const storyObj = story?.toObject();
    
    // Get actual like records
    const likes = await Like.find({ storyId });
    
    return res.status(200).json({
      success: true,
      storyId,
      storyLikeCount: {
        mongooseProperty: story?.likeCount,
        rawObject: storyObj?.likeCount,
      },
      actualLikeRecords: {
        count: likes.length,
        userIds: likes.map(like => like.userId)
      },
      mismatch: likes.length !== (storyObj?.likeCount || 0)
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
