import { connectToDatabase } from "../lib/mongodb.js";
import { Story } from "../models/index.js";

export default async function handler(req, res) {
  const { id } = req.query || {};
  console.log(`[DEBUG DOCUMENT] ${req.method} /api/debug-story-document?id=${id}`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // Connect to production database
    await connectToDatabase();

    // Get the raw document
    const story = await Story.findOne({ storyId: id });
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    console.log(`[DEBUG DOCUMENT] Raw story document:`, story.toObject());

    return res.status(200).json({
      success: true,
      storyId: story.storyId,
      title: story.title,
      fieldTypes: {
        views: typeof story.views,
        likeCount: typeof story.likeCount,
        averageRating: typeof story.averageRating,
        commentCount: typeof story.commentCount,
        ratingCount: typeof story.ratingCount,
      },
      fieldValues: {
        views: story.views,
        likeCount: story.likeCount,
        averageRating: story.averageRating,
        commentCount: story.commentCount,
        ratingCount: story.ratingCount,
      },
      rawValues: {
        views: JSON.stringify(story.views),
        likeCount: JSON.stringify(story.likeCount),
        averageRating: JSON.stringify(story.averageRating),
        commentCount: JSON.stringify(story.commentCount),
        ratingCount: JSON.stringify(story.ratingCount),
      }
    });

  } catch (error) {
    console.error(`[DEBUG DOCUMENT] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to debug document",
      error: error.message,
    });
  }
}
