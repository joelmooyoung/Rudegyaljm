import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, Heart, RefreshCw } from "lucide-react";
import { validatePassword, generateStrongPassword } from "@/utils/passwordValidation";

interface ResetPasswordProps {
  onNavigateToAuth?: () => void;
  onNavigateToForgotPassword?: () => void;
}

export default function ResetPassword({ onNavigateToAuth, onNavigateToForgotPassword }: ResetPasswordProps) {
  // Get token from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const passwordValidation = validatePassword(newPassword);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setNewPassword(generated);
    setConfirmPassword(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Invalid reset token");
      return;
    }

    if (!passwordValidation.isValid) {
      setError("Please fix password requirements");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
                setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          onNavigateToAuth?.();
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
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
                Password Reset Successfully!
              </CardTitle>
              <CardDescription className="text-base font-serif text-muted-foreground mt-2">
                Your password has been updated. You can now login with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Redirecting to login page in 3 seconds...
                </p>
                
                                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={onNavigateToAuth}
                >
                  Go to Login Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-desire-gradient opacity-10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />

        <div className="relative z-10 w-full max-w-md mx-auto">
          <Card className="story-card-intimate passionate-shimmer seductive-border">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-display font-bold text-destructive">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-base font-serif text-muted-foreground mt-2">
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3">
                <Link to="/forgot-password">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Request New Reset Link
                  </Button>
                </Link>

                <Link to="/auth">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
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
          <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

        <Card className="story-card-intimate passionate-shimmer seductive-border">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-seductive-gradient rounded-full flex items-center justify-center mb-4 passionate-glow">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display font-bold text-passion-gradient">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-base font-serif text-muted-foreground mt-2">
              Choose a strong new password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-password" className="text-base font-serif">
                    New Password
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGeneratePassword}
                    className="text-xs text-accent hover:text-accent/80"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accent" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-11 pr-12 py-3 text-lg font-serif bg-input/80 seductive-border focus:passionate-glow transition-all duration-300"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password Strength</span>
                      <span className={`font-medium ${
                        passwordValidation.strength === "very_strong" ? "text-green-500" :
                        passwordValidation.strength === "strong" ? "text-green-400" :
                        passwordValidation.strength === "medium" ? "text-yellow-500" :
                        "text-red-500"
                      }`}>
                        {passwordValidation.strength?.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <Progress value={passwordValidation.score * 20} className="h-2" />
                    
                    {passwordValidation.errors.length > 0 && (
                      <ul className="text-xs text-destructive space-y-1">
                        {passwordValidation.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="text-base font-serif">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accent" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 py-3 text-lg font-serif bg-input/80 seductive-border focus:passionate-glow transition-all duration-300"
                    required
                  />
                </div>
                
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading || !passwordValidation.isValid || newPassword !== confirmPassword}
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  to="/auth"
                  className="text-accent hover:text-accent/80 font-medium"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
