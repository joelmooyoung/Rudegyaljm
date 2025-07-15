// Track story views
export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    console.log("[STORY VIEW] Tracking view for story:", id);

    // In a real app, this would increment the view count in the database
    // For now, just return success
    res.json({ message: "View tracked", storyId: id });
  } catch (error) {
    console.error("[STORY VIEW] Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
