// API configuration for handling different environments

const isBuilderPreview = window.location.hostname.includes("builder.my");
const isLocalDev = window.location.hostname.includes("localhost");

// For Builder.io preview, use Vercel production APIs for database operations
const VERCEL_PRODUCTION_URL =
  "https://rudegyaljm-et05yzbra-joel-moo-youngs-projects.vercel.app";

// API endpoints that need database access
const DATABASE_ENDPOINTS = [
  "/api/seed-database",
  "/api/verify-database",
  "/api/clear-database",
  "/api/stories",
  "/api/users",
  "/api/auth/login",
  "/api/auth/register",
];

export function getApiUrl(endpoint: string): string {
  // If we're in Builder.io preview and it's a database endpoint,
  // route to Vercel production
  if (
    isBuilderPreview &&
    DATABASE_ENDPOINTS.some((dbEndpoint) => endpoint.startsWith(dbEndpoint))
  ) {
    console.log(
      `🔄 Routing ${endpoint} to Vercel production for database access`,
    );
    return `${VERCEL_PRODUCTION_URL}${endpoint}`;
  }

  // Otherwise use local/current environment
  return endpoint;
}

export function makeApiRequest(endpoint: string, options: RequestInit = {}) {
  const url = getApiUrl(endpoint);

  // Add CORS headers for cross-origin requests to Vercel
  if (url.startsWith(VERCEL_PRODUCTION_URL)) {
    options.headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };

    // Enable CORS mode
    options.mode = "cors";
  }

  console.log(`🌐 API Request: ${url}`, options);
  return fetch(url, options);
}

export const apiConfig = {
  isBuilderPreview,
  isLocalDev,
  vercelUrl: VERCEL_PRODUCTION_URL,
  getApiUrl,
  makeApiRequest,
};
