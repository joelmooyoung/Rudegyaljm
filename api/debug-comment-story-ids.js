import { connectToDatabase } from "../lib/mongodb.js";
import { Comment, Story } from "../models/index.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    // Get all stories with their IDs
    const stories = await Story.find(
      {},
      {
        _id: 1,
        id: 1,
        storyId: 1,
        title: 1,
      },
    ).limit(5);

    // Get all comments with their story IDs
    const comments = await Comment.find(
      {},
      {
        _id: 1,
        commentId: 1,
        storyId: 1,
        comment: 1,
        username: 1,
      },
    ).limit(10);

    // Check which comments match which stories
    const relationships = comments.map((comment) => {
      const matchingStory = stories.find(
        (story) =>
          story.storyId === comment.storyId ||
          story.id === comment.storyId ||
          story._id.toString() === comment.storyId,
      );

      return {
        comment: {
          commentId: comment.commentId,
          storyId: comment.storyId,
          username: comment.username,
          comment: comment.comment.substring(0, 50) + "...",
        },
        matchingStory: matchingStory
          ? {
              title: matchingStory.title,
              storyId: matchingStory.storyId,
              id: matchingStory.id,
              _id: matchingStory._id,
            }
          : null,
        hasMatch: !!matchingStory,
      };
    });

    return res.status(200).json({
      success: true,
      stories: stories.map((s) => ({
        title: s.title,
        storyId: s.storyId,
        id: s.id,
        _id: s._id,
      })),
      comments: comments.map((c) => ({
        commentId: c.commentId,
        storyId: c.storyId,
        username: c.username,
      })),
      relationships,
      analysis: {
        totalStories: stories.length,
        totalComments: comments.length,
        matchedComments: relationships.filter((r) => r.hasMatch).length,
        unmatchedComments: relationships.filter((r) => !r.hasMatch).length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
