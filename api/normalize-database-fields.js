import { connectToDatabase } from "../lib/mongodb.js";
import {
  Story,
  User,
  Comment,
  Like,
  Rating,
  UserStoryRead,
} from "../models/index.js";

export default async function handler(req, res) {
  console.log(`[NORMALIZE DB] ${req.method} /api/normalize-database-fields`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    await connectToDatabase();
    console.log("[NORMALIZE DB] Connected to database");

    const results = {
      stories: await normalizeStoryFields(),
      users: await normalizeUserFields(),
      comments: await normalizeCommentFields(),
      likes: await normalizeLikeFields(),
      ratings: await normalizeRatingFields(),
      userStoryReads: await normalizeUserStoryReadFields(),
    };

    console.log("[NORMALIZE DB] Normalization completed successfully");

    return res.status(200).json({
      success: true,
      message: "Database fields normalized successfully",
      results: results,
    });
  } catch (error) {
    console.error("[NORMALIZE DB] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Database normalization failed",
      error: error.message,
    });
  }
}

async function normalizeStoryFields() {
  console.log("[NORMALIZE DB] Normalizing Story fields...");

  const stories = await Story.find({});
  let normalizedCount = 0;
  const changes = [];

  for (const story of stories) {
    const storyObj = story.toObject();
    const updates = {};
    const storyChanges = [];
    let needsUpdate = false;

    // 1. Consolidate view fields: viewCount -> views
    if (storyObj.viewCount !== undefined) {
      const currentViews = storyObj.views || 0;
      const legacyViewCount = storyObj.viewCount || 0;
      updates.views = Math.max(currentViews, legacyViewCount);
      needsUpdate = true;
      storyChanges.push(
        `views: ${currentViews} -> ${updates.views} (merged from viewCount: ${legacyViewCount})`,
      );
    }

    // 2. Consolidate rating fields: rating -> averageRating
    if (storyObj.rating !== undefined) {
      const currentRating = storyObj.averageRating || 0;
      const legacyRating = storyObj.rating || 0;
      updates.averageRating = Math.max(currentRating, legacyRating);
      needsUpdate = true;
      storyChanges.push(
        `averageRating: ${currentRating} -> ${updates.averageRating} (merged from rating: ${legacyRating})`,
      );
    }

    // 3. Ensure all stat fields exist and are numbers
    const statFields = [
      "views",
      "likeCount",
      "averageRating",
      "commentCount",
      "ratingCount",
    ];
    for (const field of statFields) {
      if (
        storyObj[field] === undefined ||
        storyObj[field] === null ||
        typeof storyObj[field] !== "number"
      ) {
        updates[field] = 0;
        needsUpdate = true;
        storyChanges.push(`initialized ${field} to 0`);
      }
    }

    // 4. Standardize published field (published -> published, remove isPublished)
    if (storyObj.isPublished !== undefined) {
      updates.published = Boolean(storyObj.isPublished);
      needsUpdate = true;
      storyChanges.push(
        `published: ${storyObj.published} -> ${updates.published} (from isPublished)`,
      );
    }

    // 5. Remove legacy fields
    const fieldsToRemove = ["viewCount", "rating", "isPublished"];
    const $unset = {};

    for (const field of fieldsToRemove) {
      if (storyObj[field] !== undefined) {
        $unset[field] = "";
        needsUpdate = true;
        storyChanges.push(`removed legacy field: ${field}`);
      }
    }

    // Apply updates
    if (needsUpdate) {
      const updateOperation = {};

      if (Object.keys(updates).length > 0) {
        updateOperation.$set = updates;
      }

      if (Object.keys($unset).length > 0) {
        updateOperation.$unset = $unset;
      }

      await Story.findOneAndUpdate({ storyId: story.storyId }, updateOperation);

      normalizedCount++;
      changes.push({
        storyId: story.storyId,
        title: story.title,
        changes: storyChanges,
      });

      console.log(
        `[NORMALIZE DB] Story ${story.storyId}: ${storyChanges.join(", ")}`,
      );
    }
  }

  return {
    totalStories: stories.length,
    normalizedCount,
    sampleChanges: changes.slice(0, 3),
  };
}

async function normalizeUserFields() {
  console.log("[NORMALIZE DB] Normalizing User fields...");

  const users = await User.find({});
  let normalizedCount = 0;
  const changes = [];

  for (const user of users) {
    const userObj = user.toObject();
    const updates = {};
    const userChanges = [];
    let needsUpdate = false;

    // 1. Standardize role field (type -> keep as type, but ensure consistency)
    if (userObj.role !== undefined && userObj.type !== userObj.role) {
      updates.type = userObj.role;
      needsUpdate = true;
      userChanges.push(
        `type: ${userObj.type} -> ${userObj.role} (from role field)`,
      );
    }

    // 2. Standardize active field (isActive -> active)
    if (userObj.isActive !== undefined && userObj.active !== userObj.isActive) {
      updates.active = Boolean(userObj.isActive);
      needsUpdate = true;
      userChanges.push(
        `active: ${userObj.active} -> ${userObj.isActive} (from isActive)`,
      );
    }

    // 3. Ensure required numeric fields exist
    if (userObj.loginCount === undefined || userObj.loginCount === null) {
      updates.loginCount = 0;
      needsUpdate = true;
      userChanges.push(`initialized loginCount to 0`);
    }

    // 4. Remove inconsistent fields
    const fieldsToRemove = [
      "role",
      "isActive",
      "subscriptionStatus",
      "subscriptionExpiry",
      "isAgeVerified",
    ];
    const $unset = {};

    for (const field of fieldsToRemove) {
      if (userObj[field] !== undefined) {
        $unset[field] = "";
        needsUpdate = true;
        userChanges.push(`removed inconsistent field: ${field}`);
      }
    }

    // Apply updates
    if (needsUpdate) {
      const updateOperation = {};

      if (Object.keys(updates).length > 0) {
        updateOperation.$set = updates;
      }

      if (Object.keys($unset).length > 0) {
        updateOperation.$unset = $unset;
      }

      await User.findOneAndUpdate({ userId: user.userId }, updateOperation);

      normalizedCount++;
      changes.push({
        userId: user.userId,
        username: user.username,
        changes: userChanges,
      });

      console.log(
        `[NORMALIZE DB] User ${user.userId}: ${userChanges.join(", ")}`,
      );
    }
  }

  return {
    totalUsers: users.length,
    normalizedCount,
    sampleChanges: changes.slice(0, 3),
  };
}

async function normalizeCommentFields() {
  console.log("[NORMALIZE DB] Normalizing Comment fields...");

  const comments = await Comment.find({});
  let normalizedCount = 0;
  const changes = [];

  for (const comment of comments) {
    const commentObj = comment.toObject();
    const updates = {};
    const commentChanges = [];
    let needsUpdate = false;

    // 1. Standardize comment content field (content -> comment)
    if (
      commentObj.content !== undefined &&
      commentObj.comment !== commentObj.content
    ) {
      updates.comment = commentObj.content;
      needsUpdate = true;
      commentChanges.push(`comment: updated from content field`);
    }

    // 2. Remove inconsistent fields
    const fieldsToRemove = ["content"];
    const $unset = {};

    for (const field of fieldsToRemove) {
      if (commentObj[field] !== undefined) {
        $unset[field] = "";
        needsUpdate = true;
        commentChanges.push(`removed inconsistent field: ${field}`);
      }
    }

    // Apply updates
    if (needsUpdate) {
      const updateOperation = {};

      if (Object.keys(updates).length > 0) {
        updateOperation.$set = updates;
      }

      if (Object.keys($unset).length > 0) {
        updateOperation.$unset = $unset;
      }

      await Comment.findOneAndUpdate(
        { commentId: comment.commentId },
        updateOperation,
      );

      normalizedCount++;
      changes.push({
        commentId: comment.commentId,
        changes: commentChanges,
      });

      console.log(
        `[NORMALIZE DB] Comment ${comment.commentId}: ${commentChanges.join(", ")}`,
      );
    }
  }

  return {
    totalComments: comments.length,
    normalizedCount,
    sampleChanges: changes.slice(0, 3),
  };
}

async function normalizeLikeFields() {
  console.log("[NORMALIZE DB] Normalizing Like fields...");

  const likes = await Like.find({});
  console.log(
    `[NORMALIZE DB] Found ${likes.length} likes - schema is already consistent`,
  );

  return {
    totalLikes: likes.length,
    normalizedCount: 0,
    message: "Like schema is already consistent",
  };
}

async function normalizeRatingFields() {
  console.log("[NORMALIZE DB] Normalizing Rating fields...");

  const ratings = await Rating.find({});
  console.log(
    `[NORMALIZE DB] Found ${ratings.length} ratings - schema is already consistent`,
  );

  return {
    totalRatings: ratings.length,
    normalizedCount: 0,
    message: "Rating schema is already consistent",
  };
}

async function normalizeUserStoryReadFields() {
  console.log("[NORMALIZE DB] Normalizing UserStoryRead fields...");

  const reads = await UserStoryRead.find({});
  console.log(
    `[NORMALIZE DB] Found ${reads.length} story reads - schema is already consistent`,
  );

  return {
    totalReads: reads.length,
    normalizedCount: 0,
    message: "UserStoryRead schema is already consistent",
  };
}
