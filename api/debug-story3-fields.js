import { connectToDatabase } from "../lib/mongodb.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
  console.log(`[DEBUG STORY3] Investigating all view-related fields...`);

  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    const storiesCollection = db.collection("stories");

    // Get the raw document directly from MongoDB
    const rawDoc = await storiesCollection.findOne({ storyId: "story3" });
    
    console.log(`[DEBUG STORY3] Raw MongoDB document fields:`, Object.keys(rawDoc));
    console.log(`[DEBUG STORY3] View-related fields:`, {
      views: rawDoc.views,
      viewCount: rawDoc.viewCount,
      viewsType: typeof rawDoc.views,
      viewCountType: typeof rawDoc.viewCount
    });

    // Try incrementing both fields to see which one "sticks"
    console.log(`[DEBUG STORY3] Testing increment on 'views' field...`);
    const viewsResult = await storiesCollection.updateOne(
      { storyId: "story3" },
      { $inc: { views: 1 } }
    );
    
    console.log(`[DEBUG STORY3] Testing increment on 'viewCount' field...`);
    const viewCountResult = await storiesCollection.updateOne(
      { storyId: "story3" },
      { $inc: { viewCount: 1 } }
    );

    // Check the document after both increments
    const afterDoc = await storiesCollection.findOne({ storyId: "story3" });
    
    console.log(`[DEBUG STORY3] After increments:`, {
      views: afterDoc.views,
      viewCount: afterDoc.viewCount,
      viewsType: typeof afterDoc.views,
      viewCountType: typeof afterDoc.viewCount
    });

    return res.json({
      success: true,
      message: "Story3 field investigation completed",
      before: {
        views: rawDoc.views,
        viewCount: rawDoc.viewCount,
        allFields: Object.keys(rawDoc)
      },
      incrementResults: {
        views: viewsResult,
        viewCount: viewCountResult
      },
      after: {
        views: afterDoc.views,
        viewCount: afterDoc.viewCount
      }
    });

  } catch (error) {
    console.error(`[DEBUG STORY3] Error:`, error);
    return res.status(500).json({
      error: error.message
    });
  }
}
