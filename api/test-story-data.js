import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[TEST STORY DATA] ${req.method} /api/test-story-data`);

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    
    // Get a sample story to check what fields are available
    const story = await Story.findOne().limit(1);
    
    if (!story) {
      return res.json({
        success: false,
        message: "No stories found",
      });
    }

    console.log("[TEST STORY DATA] Sample story fields:", Object.keys(story.toObject()));
    console.log("[TEST STORY DATA] Sample story content preview:", {
      id: story.storyId,
      title: story.title,
      hasContent: !!story.content,
      contentLength: story.content ? story.content.length : 0,
      hasImage: !!story.image,
      image: story.image,
      hasAudio: !!story.audioUrl,
      audioUrl: story.audioUrl,
      allFields: Object.keys(story.toObject())
    });

    return res.json({
      success: true,
      story: {
        id: story.storyId,
        title: story.title,
        hasContent: !!story.content,
        contentLength: story.content ? story.content.length : 0,
        contentPreview: story.content ? story.content.substring(0, 200) + "..." : null,
        hasImage: !!story.image,
        image: story.image,
        hasAudio: !!story.audioUrl,
        audioUrl: story.audioUrl,
        allFields: Object.keys(story.toObject())
      }
    });

  } catch (error) {
    console.error("[TEST STORY DATA] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to test story data",
      error: error.message
    });
  }
}
