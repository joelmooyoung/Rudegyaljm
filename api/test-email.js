import { Resend } from "resend";

export default async function handler(req, res) {
  console.log(`[TEST EMAIL API] ${req.method} /api/test-email`);

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Resend API key not configured",
      });
    }

    console.log(`[TEST EMAIL API] Testing email to: ${email}`);

    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@rudegyaljm.com",
      to: email,
      subject: "Test Email - Rude Gyal Confessions",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
          <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Test Email</h1>
            <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Rude Gyal Confessions</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #374151; margin-bottom: 20px;">Email Service Test</h2>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              🎉 Congratulations! Your Resend email integration is working perfectly.
            </p>
            
            <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 6px; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; color: #166534; font-size: 14px;">
                ✅ <strong>Success:</strong> Email service is properly configured and functional.
              </p>
            </div>
            
            <ul style="color: #6b7280; font-size: 14px; margin: 20px 0;">
              <li>✅ Resend API connection established</li>
              <li>✅ Email template rendering correctly</li>
              <li>✅ From address configured</li>
              <li>✅ Ready for password reset emails</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              This is a test email sent at ${new Date().toLocaleString()}.
            </p>
            
            <p style="color: #9ca3af; font-size: 13px; margin: 15px 0 0 0;">
              Best regards,<br>
              The Rude Gyal Confessions Team
            </p>
          </div>
        </div>
      `,
    });

    console.log(
      `[TEST EMAIL API] ��� Test email sent successfully:`,
      emailResult.data?.id,
    );

    return res.status(200).json({
      success: true,
      message: "Test email sent successfully!",
      emailId: emailResult.data?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TEST EMAIL API] ❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message,
    });
  }
}
