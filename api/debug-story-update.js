import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    const storyId = req.query.id || req.query.storyId;

    // Check what we're receiving
    const debug = {
      requestMethod: req.method,
      urlParams: req.query,
      pathStoryId: storyId,
      requestBody: req.body,
    };

    // Try different ways to find the story
    const searches = {};

    // Search by id field
    try {
      const byId = await Story.findOne({ id: storyId });
      searches.byId = byId ? "FOUND" : "NOT_FOUND";
      if (byId)
        searches.byIdData = {
          id: byId.id,
          storyId: byId.storyId,
          title: byId.title,
        };
    } catch (e) {
      searches.byId = `ERROR: ${e.message}`;
    }

    // Search by storyId field
    try {
      const byStoryId = await Story.findOne({ storyId: storyId });
      searches.byStoryId = byStoryId ? "FOUND" : "NOT_FOUND";
      if (byStoryId)
        searches.byStoryIdData = {
          id: byStoryId.id,
          storyId: byStoryId.storyId,
          title: byStoryId.title,
        };
    } catch (e) {
      searches.byStoryId = `ERROR: ${e.message}`;
    }

    // Search by _id field
    try {
      const by_Id = await Story.findById(storyId);
      searches.by_Id = by_Id ? "FOUND" : "NOT_FOUND";
      if (by_Id)
        searches.by_IdData = {
          id: by_Id.id,
          storyId: by_Id.storyId,
          title: by_Id.title,
        };
    } catch (e) {
      searches.by_Id = `ERROR: ${e.message}`;
    }

    // Show all stories in collection
    const allStories = await Story.find(
      {},
      { id: 1, storyId: 1, title: 1, _id: 1 },
    ).limit(5);

    return res.status(200).json({
      success: true,
      debug,
      searches,
      allStoriesInDB: allStories,
      message: `Debugging story lookup for: ${storyId}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
