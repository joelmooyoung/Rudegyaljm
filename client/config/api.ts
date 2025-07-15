// API configuration for different environments
const API_BASE_URL = import.meta.env.PROD
  ? "https://rudegyaljm.com/api" // Your production domain
  : "/api"; // Local development

export { API_BASE_URL };
