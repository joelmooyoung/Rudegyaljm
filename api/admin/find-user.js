import { connectToDatabase } from "../../lib/mongodb.js";
import { User } from "../../models/index.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Support both POST (JSON body) and GET (?email= or ?username= or ?q=)
    const source = req.method === "GET" ? req.query : req.body || {};
    const { email, username, q } = source;

    await connectToDatabase();

    const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : undefined);
    const emailL = norm(email);
    const usernameL = norm(username);
    const qL = norm(q);

    let user = null;

    // Prefer exact matches first
    if (emailL) {
      user = await User.findOne({ email: emailL });
    }
    if (!user && usernameL) {
      user = await User.findOne({ username: usernameL });
    }

    // Fallback to fuzzy search if not found
    let matches = [];
    if (!user && (emailL || usernameL || qL)) {
      const regex = (val) => new RegExp(val.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
      const ors = [];
      if (emailL) {
        ors.push({ email: regex(emailL) });
      }
      if (usernameL) {
        ors.push({ username: regex(usernameL) });
      }
      if (qL) {
        ors.push({ email: regex(qL) }, { username: regex(qL) });
      }
      if (ors.length > 0) {
        matches = await User.find({ $or: ors }).limit(10).select(
          "userId email username type active createdAt lastLogin loginCount",
        );
      }
    }

    if (!user && matches.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user) {
      return res.status(200).json({
        success: true,
        user: {
          id: user.userId,
          email: user.email,
          username: user.username,
          role: user.type,
          isActive: user.active,
          isAgeVerified: true,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount || 0,
        },
      });
    }

    // Return suggestions if no exact match
    return res.status(200).json({
      success: true,
      user: null,
      matches: matches.map((u) => ({
        id: u.userId,
        email: u.email,
        username: u.username,
        role: u.type,
        isActive: u.active,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        loginCount: u.loginCount || 0,
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Internal error" });
  }
}
