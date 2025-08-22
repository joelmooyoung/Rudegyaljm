import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[TEST FIX VIEWCOUNT] Testing viewCount field type issue...`);

  try {
    await connectToDatabase();

    // Find story3 specifically
    const story = await Story.findOne({ storyId: "story3" });
    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    const storyObj = story.toObject();
    console.log(`[TEST] Before fix - viewCount type: ${typeof storyObj.viewCount}, value: ${storyObj.viewCount}`);

    // Convert viewCount to number if it's a string
    const currentViewCount = parseInt(storyObj.viewCount) || 0;
    console.log(`[TEST] Parsed viewCount as number: ${currentViewCount}`);

    // Update the field to be a proper number
    const updateResult = await Story.updateOne(
      { storyId: "story3" },
      { 
        $set: { 
          viewCount: currentViewCount, // Ensure it's stored as number
          updatedAt: new Date() 
        }
      }
    );

    console.log(`[TEST] Set viewCount as number result:`, updateResult);

    // Now try to increment
    const incResult = await Story.updateOne(
      { storyId: "story3" },
      { 
        $inc: { viewCount: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`[TEST] Increment result:`, incResult);

    // Check the final result
    const finalStory = await Story.findOne({ storyId: "story3" });
    const finalObj = finalStory.toObject();
    
    console.log(`[TEST] After increment - viewCount type: ${typeof finalObj.viewCount}, value: ${finalObj.viewCount}`);

    return res.json({
      success: true,
      message: "ViewCount field type test completed",
      before: {
        type: typeof storyObj.viewCount,
        value: storyObj.viewCount
      },
      after: {
        type: typeof finalObj.viewCount,
        value: finalObj.viewCount
      },
      updateResult,
      incResult
    });

  } catch (error) {
    console.error(`[TEST FIX VIEWCOUNT] Error:`, error);
    return res.status(500).json({
      error: error.message
    });
  }
}
