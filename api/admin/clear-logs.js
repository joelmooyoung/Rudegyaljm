// Clear logs API
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
    const { type } = req.body;

    console.log(`Clearing ${type} logs`);

    // In a real implementation, this would clear the actual logs
    // For now, just return success
    res.json({ message: `${type} logs cleared successfully` });
  } catch (error) {
    console.error("Clear logs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
