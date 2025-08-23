// Admin endpoint to clear landing page cache
// This helps admins force cache refresh when content changes

export default async function handler(req, res) {
  console.log(`[CLEAR LANDING CACHE] ${req.method} /api/admin/clear-landing-cache`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    // This endpoint doesn't actually clear client-side cache (that's localStorage on the client)
    // Instead, it signals to clients that they should clear their cache
    // We could implement a timestamp-based invalidation system

    console.log("[CLEAR LANDING CACHE] Cache clear signal sent");

    return res.status(200).json({
      success: true,
      message: "Landing page cache clear signal sent",
      timestamp: Date.now(),
      instructions: {
        clientAction: "Clear localStorage cache with key pattern 'landing_stats_*'",
        cachePattern: "landing_stats_*",
        clearAll: true
      }
    });

  } catch (error) {
    console.error("[CLEAR LANDING CACHE] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear cache",
      error: error.message
    });
  }
}
