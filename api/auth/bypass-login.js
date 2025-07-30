// Hardcoded authentication bypass for testing
export default function handler(req, res) {
  console.log("Bypass login endpoint called");

  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  // Hardcoded test accounts that always work
  const testAccounts = {
    "admin@nocturne.com": {
      password: "admin123",
      user: {
        id: "admin-001",
        email: "admin@nocturne.com",
        username: "admin",
        role: "admin",
        isActive: true
      }
    },
    "joelmooyoung@me.com": {
      password: "password123",
      user: {
        id: "joel-001", 
        email: "joelmooyoung@me.com",
        username: "joelmooyoung",
        role: "admin",
        isActive: true
      }
    }
  };

  const account = testAccounts[email.toLowerCase()];
  
  if (!account || account.password !== password) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  // Return success with hardcoded user data
  return res.status(200).json({
    success: true,
    message: "Login successful",
    token: `bypass_token_${account.user.id}_${Date.now()}`,
    user: account.user
  });
}
