// Admin endpoint to remove hardcoded authentication and switch to database-only
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  console.log(`[REMOVE HARDCODED API] ${req.method} /api/admin/remove-hardcoded-auth`);

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
      message: "Method not allowed",
    });
  }

  try {
    console.log("[REMOVE HARDCODED API] Removing hardcoded authentication...");
    
    // Read the server file
    const serverFilePath = path.join(process.cwd(), 'server', 'index.ts');
    let serverContent = await fs.readFile(serverFilePath, 'utf-8');
    
    // Remove the hardcoded accounts section
    const hardcodedAccountsStart = serverContent.indexOf('// RELIABLE ACCOUNTS THAT ALWAYS WORK');
    const hardcodedAccountsEnd = serverContent.indexOf('// Try database authentication as backup only');
    
    if (hardcodedAccountsStart !== -1 && hardcodedAccountsEnd !== -1) {
      // Remove the hardcoded section and the check
      const beforeHardcoded = serverContent.substring(0, hardcodedAccountsStart);
      const afterHardcoded = serverContent.substring(hardcodedAccountsEnd);
      
      // Also remove the hardcoded account check logic
      const checkStart = afterHardcoded.indexOf('// Check reliable accounts first');
      const checkEnd = afterHardcoded.indexOf('// Try database authentication as backup only');
      
      if (checkStart !== -1 && checkEnd !== -1) {
        const beforeCheck = afterHardcoded.substring(0, checkStart);
        const afterCheck = afterHardcoded.substring(checkEnd);
        serverContent = beforeHardcoded + beforeCheck + afterCheck;
      } else {
        serverContent = beforeHardcoded + afterHardcoded;
      }
      
      // Clean up the authentication flow
      serverContent = serverContent.replace(
        '// Try database authentication as backup only',
        '// Database authentication'
      );
      
      // Write the updated file
      await fs.writeFile(serverFilePath, serverContent, 'utf-8');
      
      console.log("[REMOVE HARDCODED API] ✅ Hardcoded authentication removed successfully");
      
      return res.status(200).json({
        success: true,
        message: "Hardcoded authentication removed successfully. Server will need to restart to take effect.",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "No hardcoded authentication found or already removed.",
      });
    }
  } catch (error) {
    console.error("[REMOVE HARDCODED API] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove hardcoded authentication",
      error: error.message,
    });
  }
}
