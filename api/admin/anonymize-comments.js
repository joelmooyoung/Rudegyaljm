import { connectToDatabase } from "../../lib/mongodb.js";
import { Comment } from "../../models/index.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { beforeDate, alsoAnonymizeUserId } = req.body || {};

    await connectToDatabase();

    const filter = {};
    if (beforeDate) {
      const cutoff = new Date(beforeDate);
      if (!isNaN(cutoff.getTime())) {
        filter.createdAt = { $lt: cutoff };
      }
    }

    // Only target comments that are not already anonymous
    filter.username = { $ne: "Anonymous" };

    const update = { $set: { username: "Anonymous" } };
    if (alsoAnonymizeUserId) {
      update.$set.userId = "anonymous";
    }

    const result = await Comment.updateMany(filter, update);

    return res.status(200).json({
      success: true,
      message: `Anonymized ${result.modifiedCount} comment(s)`,
      modified: result.modifiedCount,
      matched: result.matchedCount,
      options: { beforeDate: beforeDate || null, alsoAnonymizeUserId: !!alsoAnonymizeUserId },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Internal error" });
  }
}
