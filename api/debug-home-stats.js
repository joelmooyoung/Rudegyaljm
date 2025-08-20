import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    
    const stories = await Story.find({ published: true }).limit(3);
    
    const debugData = stories.map((story) => {
      const storyObj = story.toObject();
      return {
        storyId: story.storyId,
        title: story.title,
        mongooseFields: {
          rating: story.rating,
          ratingCount: story.ratingCount,
          viewCount: story.viewCount,
          commentCount: story.commentCount,
        },
        rawObjectFields: {
          rating: storyObj.rating,
          ratingCount: storyObj.ratingCount,
          viewCount: storyObj.viewCount,
          commentCount: storyObj.commentCount,
        }
      };
    });

    return res.status(200).json({
      success: true,
      debugData: debugData
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
