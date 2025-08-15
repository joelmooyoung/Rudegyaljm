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
import { ArrowLeft, Mail, Heart, CheckCircle } from "lucide-react";

interface ForgotPasswordProps {
  onNavigateToAuth?: () => void;
}

export default function ForgotPassword({
  onNavigateToAuth,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log(
      "🔍 [FORGOT PASSWORD] Starting forgot password request for:",
      email,
    );

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("🔍 [FORGOT PASSWORD] Response status:", response.status);
      console.log(
        "🔍 [FORGOT PASSWORD] Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      const data = await response.json();
      console.log("🔍 [FORGOT PASSWORD] Response data:", data);

      if (response.ok) {
        setIsSuccess(true);
        console.log("✅ [FORGOT PASSWORD] Request successful");

        // In development, show the reset token for testing
        if (data.resetToken) {
          console.log("🔑 Reset token for testing:", data.resetToken);
          console.log("🔗 Reset URL for testing:", data.resetUrl);
        }
      } else {
        console.error("�� [FORGOT PASSWORD] Request failed:", data.message);
        setError(data.message || "Failed to send reset link");
      }
    } catch (err) {
      console.error("❌ [FORGOT PASSWORD] Network error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-desire-gradient opacity-10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />

        <div className="relative z-10 w-full max-w-md mx-auto">
          <Card className="story-card-intimate passionate-shimmer seductive-border">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-display font-bold text-passion-gradient">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-base font-serif text-muted-foreground mt-2">
                If an account with that email exists, we've sent you a password
                reset link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Didn't receive an email? Check your spam folder or try again.
                </p>

                {process.env.NODE_ENV === "development" && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      <strong>Development Mode:</strong> Check the browser
                      console for the reset link.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Try Different Email
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={onNavigateToAuth}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-desire-gradient opacity-10 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <button
            onClick={onNavigateToAuth}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>
        </div>

        <Card className="story-card-intimate passionate-shimmer seductive-border">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-seductive-gradient rounded-full flex items-center justify-center mb-4 passionate-glow">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display font-bold text-passion-gradient">
              Forgot Your Password?
            </CardTitle>
            <CardDescription className="text-base font-serif text-muted-foreground mt-2">
              No worries! Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-serif">
                  Your Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accent" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="whisper@yourdesires.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 py-3 text-lg font-serif bg-input/80 seductive-border focus:passionate-glow transition-all duration-300"
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <button
                  onClick={onNavigateToAuth}
                  className="text-accent hover:text-accent/80 font-medium underline-offset-4 hover:underline"
                >
                  Sign in instead
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
