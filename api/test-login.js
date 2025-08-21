export default async function handler(req, res) {
  // This endpoint will help test login functionality
  return res.status(200).json({
    success: true,
    message: "Test login endpoint - use POST to /api/login with email and password to test login logging",
    instructions: {
      method: "POST",
      endpoint: "/api/login",
      body: {
        email: "admin@rudegyalconfessions.com",
        password: "admin123"
      }
    }
  });
}
