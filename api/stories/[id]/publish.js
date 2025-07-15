// Toggle story publish status
let stories = [
  {
    id: "1",
    title: "Midnight Desires",
    isPublished: true,
  },
  {
    id: "2",
    title: "The Executive's Secret",
    isPublished: true,
  },
  {
    id: "3",
    title: "Summer Heat",
    isPublished: true,
  },
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    console.log("[STORY PUBLISH] Toggling publish status for story:", id);

    const storyIndex = stories.findIndex((s) => s.id === id);

    if (storyIndex === -1) {
      console.log("[STORY PUBLISH] Error: Story not found:", id);
      return res.status(404).json({ message: "Story not found" });
    }

    // Toggle published status
    stories[storyIndex].isPublished = !stories[storyIndex].isPublished;
    console.log(
      "[STORY PUBLISH] Success! Story",
      id,
      "publish status:",
      stories[storyIndex].isPublished,
    );

    res.json({
      message: "Story publish status updated",
      isPublished: stories[storyIndex].isPublished,
    });
  } catch (error) {
    console.error("[STORY PUBLISH] Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
