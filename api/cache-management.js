import cacheManager from "../lib/cache-manager.js";

export default async function handler(req, res) {
  console.log(`[CACHE MANAGEMENT] ${req.method} /api/cache-management`);

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case "GET": {
        // Get cache statistics and health
        const action = req.query.action;

        if (action === "health") {
          const healthCheck = await cacheManager.healthCheck();
          return res.json({
            success: true,
            health: healthCheck
          });
        } else if (action === "stats") {
          const stats = cacheManager.getStats();
          return res.json({
            success: true,
            stats: stats
          });
        } else {
          // Default: return comprehensive cache information
          const [healthCheck, stats] = await Promise.all([
            cacheManager.healthCheck(),
            Promise.resolve(cacheManager.getStats())
          ]);

          return res.json({
            success: true,
            cache: {
              health: healthCheck,
              stats: stats,
              endpoints: {
                health: "/api/cache-management?action=health",
                stats: "/api/cache-management?action=stats",
                clear: "POST /api/cache-management with action=clear",
                invalidate: "POST /api/cache-management with action=invalidate&pattern=*"
              }
            }
          });
        }
      }

      case "POST": {
        // Cache management actions
        const { action, pattern, key } = req.body;

        if (action === "clear") {
          await cacheManager.clear();
          console.log("[CACHE MANAGEMENT] 🗑️ All cache cleared via API");
          return res.json({
            success: true,
            message: "All cache cleared successfully"
          });
        } else if (action === "invalidate") {
          if (pattern) {
            await cacheManager.invalidatePattern(pattern);
            console.log(`[CACHE MANAGEMENT] 🗑️ Pattern '${pattern}' invalidated via API`);
            return res.json({
              success: true,
              message: `Cache pattern '${pattern}' invalidated successfully`
            });
          } else if (key) {
            await cacheManager.invalidate(key);
            console.log(`[CACHE MANAGEMENT] 🗑️ Key '${key}' invalidated via API`);
            return res.json({
              success: true,
              message: `Cache key '${key}' invalidated successfully`
            });
          } else {
            return res.status(400).json({
              success: false,
              message: "Either 'pattern' or 'key' must be provided for invalidation"
            });
          }
        } else if (action === "invalidate-stats") {
          await cacheManager.invalidateStatsCache();
          console.log("[CACHE MANAGEMENT] 🗑️ Stats cache invalidated via API");
          return res.json({
            success: true,
            message: "Statistics cache invalidated successfully"
          });
        } else if (action === "invalidate-users") {
          await cacheManager.invalidateUserCache();
          console.log("[CACHE MANAGEMENT] 🗑️ User cache invalidated via API");
          return res.json({
            success: true,
            message: "User cache invalidated successfully"
          });
        } else if (action === "invalidate-stories") {
          await cacheManager.invalidateStoryCache();
          console.log("[CACHE MANAGEMENT] 🗑️ Story cache invalidated via API");
          return res.json({
            success: true,
            message: "Story cache invalidated successfully"
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid action. Supported actions: clear, invalidate, invalidate-stats, invalidate-users, invalidate-stories"
          });
        }
      }

      case "DELETE": {
        // Quick cache clear endpoint
        await cacheManager.clear();
        console.log("[CACHE MANAGEMENT] 🗑️ All cache cleared via DELETE");
        return res.json({
          success: true,
          message: "All cache cleared successfully"
        });
      }

      default:
        return res.status(405).json({
          success: false,
          message: "Method not allowed"
        });
    }
  } catch (error) {
    console.error("[CACHE MANAGEMENT] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Cache management operation failed",
      error: error.message
    });
  }
}

// Export specific cache management functions for internal use
export const clearAllCache = () => cacheManager.clear();
export const invalidateStatsCache = () => cacheManager.invalidateStatsCache();
export const invalidateUserCache = () => cacheManager.invalidateUserCache();
export const invalidateStoryCache = () => cacheManager.invalidateStoryCache();
export const getCacheStats = () => cacheManager.getStats();
export const getCacheHealth = () => cacheManager.healthCheck();
