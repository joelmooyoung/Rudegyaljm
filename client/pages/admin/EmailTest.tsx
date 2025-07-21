import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Send, TestTube, Key } from "lucide-react";

interface EmailTestProps {
  onBack: () => void;
}

export default function EmailTest({ onBack }: EmailTestProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const sendTestEmail = async () => {
    if (!email) {
      setResult({
        message: "Please enter an email address",
        type: "error"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          message: `✅ Test email sent successfully to ${email}! Check your inbox (and spam folder). Email ID: ${data.emailId}`,
          type: "success"
        });
      } else {
        setResult({
          message: `❌ Failed to send email: ${data.message}`,
          type: "error"
        });
      }
    } catch (error) {
      setResult({
        message: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPasswordReset = async () => {
    if (!email) {
      setResult({
        message: "Please enter an email address",
        type: "error"
      });
      return;
    }

    setTestLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        let message = `✅ Password reset email sent successfully! Check your inbox (and spam folder).`;
        
        // In development, show the reset token
        if (data.resetToken) {
          message += `\n\nDevelopment Mode:\nReset Token: ${data.resetToken}\nReset URL: ${data.resetUrl}`;
        }
        
        setResult({
          message,
          type: "success"
        });
      } else {
        setResult({
          message: `❌ Failed to send password reset: ${data.message}`,
          type: "error"
        });
      }
    } catch (error) {
      setResult({
        message: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "error"
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <TestTube className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-display font-bold text-passion-gradient">
                Email Service Test
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Info Card */}
          <Card className="story-card-intimate seductive-border">
            <CardHeader>
              <CardTitle className="text-xl font-display font-bold text-passion-gradient flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Integration Status
              </CardTitle>
              <CardDescription className="font-serif">
                Test your Resend email service integration and password reset functionality.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📧 Setup Instructions:</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Sign up at <a href="https://resend.com" target="_blank" className="underline">resend.com</a></li>
                    <li>Get your API key from the dashboard</li>
                    <li>Add <code className="bg-blue-100 px-1 rounded">RESEND_API_KEY</code> to your .env.local file</li>
                    <li>Configure <code className="bg-blue-100 px-1 rounded">RESEND_FROM_EMAIL</code> with your domain</li>
                    <li>Test below to verify everything works!</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Form */}
          <Card className="story-card-intimate seductive-border">
            <CardHeader>
              <CardTitle className="text-xl font-display font-bold text-passion-gradient">
                Test Email Functionality
              </CardTitle>
              <CardDescription className="font-serif">
                Send test emails to verify your Resend integration is working correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-serif">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Test Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="seductive-border font-serif"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={sendTestEmail}
                  disabled={isLoading || testLoading}
                  className="btn-seductive flex-1"
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? "Sending..." : "Send Test Email"}
                </Button>

                <Button
                  onClick={testPasswordReset}
                  disabled={isLoading || testLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {testLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  {testLoading ? "Sending..." : "Test Password Reset"}
                </Button>
              </div>

              {result && (
                <div
                  className={`p-4 rounded-lg font-serif text-sm ${
                    result.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  <pre className="whitespace-pre-wrap">{result.message}</pre>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">🔍 What to Check:</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Check your inbox (email should arrive within 30 seconds)</li>
                  <li>Check spam/junk folder if not in inbox</li>
                  <li>Verify the email design looks good</li>
                  <li>Test the password reset link functionality</li>
                  <li>Console logs show email ID if successful</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
