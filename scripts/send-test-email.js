// Simple email test script that can be run directly
import { Resend } from 'resend';

const resend = new Resend('re_5y74v57Z_Hkfro8qVsR2aqGXzRhvG1eW3');

async function sendTestEmail(email = 'test@example.com') {
  try {
    console.log(`🧪 Testing email to: ${email}`);
    
    const result = await resend.emails.send({
      from: 'noreply@rudegyaljm.com',
      to: email,
      subject: 'Test Email - Rude Gyal Confessions',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
          <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Email Test Successful!</h1>
            <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Rude Gyal Confessions</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #374151; margin-bottom: 20px;">🎉 Your Email System Works!</h2>
            
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Congratulations! Your Resend email integration is working perfectly. 
              Password reset emails and other notifications will now be delivered successfully.
            </p>
            
            <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 6px; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; color: #166534; font-size: 14px;">
                ✅ <strong>Success:</strong> Email service is fully operational.
              </p>
            </div>
            
            <ul style="color: #6b7280; font-size: 14px; margin: 20px 0;">
              <li>✅ Resend API connection established</li>
              <li>✅ Email template rendering correctly</li>
              <li>✅ From address configured</li>
              <li>✅ Ready for production use</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              Test sent at ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    });

    if (result.data?.id) {
      console.log(`✅ Email sent successfully!`);
      console.log(`📧 Email ID: ${result.data.id}`);
      console.log(`📨 Sent to: ${email}`);
      console.log(`🕐 Time: ${new Date().toLocaleString()}`);
      console.log(`\n🎉 Your Resend integration is working perfectly!`);
      return true;
    } else {
      console.error(`❌ Email sending failed:`, result);
      return false;
    }
  } catch (error) {
    console.error(`❌ Email test failed:`, error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Get email from command line argument or use default
const emailArg = process.argv[2] || 'test@example.com';
sendTestEmail(emailArg);
