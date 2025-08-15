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
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Calendar,
  Heart,
  CheckCircle,
} from "lucide-react";
import SubscriptionPlan, { SubscriptionPlan as PlanType } from "./SubscriptionPlan";
import { validatePassword } from "@/utils/passwordValidation";
import { User as UserType, RegisterRequest, AuthResponse } from "@shared/api";

interface RegisterWithSubscriptionProps {
  onAuthenticated: (user: UserType) => void;
  onNavigateToAuth?: () => void;
}

type RegistrationStep = "account" | "subscription" | "confirmation";

interface RegistrationData extends RegisterRequest {
  selectedPlan?: PlanType;
  paymentMethod?: any;
}

export default function RegisterWithSubscription({
  onAuthenticated,
  onNavigateToAuth,
}: RegisterWithSubscriptionProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("account");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    email: "",
    username: "",
    password: "",
    dateOfBirth: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordValidation = validatePassword(registrationData.password);

  const getStepProgress = () => {
    switch (currentStep) {
      case "account":
        return 33;
      case "subscription":
        return 66;
      case "confirmation":
        return 100;
      default:
        return 0;
    }
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    if (!passwordValidation.isValid) {
      setError("Please fix password requirements");
      return;
    }

    if (registrationData.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Verify age
    const birth = new Date(registrationData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      setError("You must be 18 or older to register");
      return;
    }

    // Move to subscription step
    setCurrentStep("subscription");
  };

  const handlePlanSelected = async (plan: PlanType, paymentMethod?: any) => {
    setRegistrationData({
      ...registrationData,
      selectedPlan: plan,
      paymentMethod: paymentMethod,
    });

    // Process registration
    setIsLoading(true);
    setError("");

    try {
      console.log("🔄 [REGISTRATION] Processing registration with subscription:", {
        email: registrationData.email,
        plan: plan.name,
        hasPayment: !!paymentMethod,
      });

      // Create the registration payload
      const registrationPayload = {
        email: registrationData.email,
        username: registrationData.username,
        password: registrationData.password,
        dateOfBirth: registrationData.dateOfBirth,
        subscriptionPlan: plan.id,
        subscriptionType: plan.type,
        paymentMethod: paymentMethod,
      };

      const response = await fetch("/api/auth/register-with-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data: AuthResponse = await response.json();
      
      console.log("✅ [REGISTRATION] Registration successful:", {
        userId: data.user.id,
        email: data.user.email,
        role: data.user.role,
        subscriptionStatus: data.user.subscriptionStatus,
      });

      localStorage.setItem("token", data.token);
      setCurrentStep("confirmation");

      // Auto-redirect after showing confirmation
      setTimeout(() => {
        onAuthenticated(data.user);
      }, 2000);

    } catch (err) {
      console.error("❌ [REGISTRATION] Registration failed:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
      setCurrentStep("subscription"); // Stay on subscription step to retry
    } finally {
      setIsLoading(false);
    }
  };

  const renderAccountStep = () => (
    <Card className="story-card-intimate passionate-shimmer seductive-border">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto w-16 h-16 bg-seductive-gradient rounded-full flex items-center justify-center mb-4 passionate-glow">
          <User className="h-8 w-8 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-display font-bold text-passion-gradient">
          Create Your Account
        </CardTitle>
        <CardDescription className="text-base font-serif text-muted-foreground mt-2">
          Join the community of desire seekers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAccountSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={registrationData.email}
                onChange={(e) =>
                  setRegistrationData({
                    ...registrationData,
                    email: e.target.value,
                  })
                }
                className="pl-10"
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={registrationData.username}
                onChange={(e) =>
                  setRegistrationData({
                    ...registrationData,
                    username: e.target.value,
                  })
                }
                className="pl-10"
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateOfBirth"
                type="date"
                value={registrationData.dateOfBirth}
                onChange={(e) =>
                  setRegistrationData({
                    ...registrationData,
                    dateOfBirth: e.target.value,
                  })
                }
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={registrationData.password}
              onChange={(e) =>
                setRegistrationData({
                  ...registrationData,
                  password: e.target.value,
                })
              }
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="new-password"
              required
            />

            {/* Password strength indicator */}
            {registrationData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Password Strength</span>
                  <span
                    className={`font-medium ${
                      passwordValidation.strength === "very-strong"
                        ? "text-green-500"
                        : passwordValidation.strength === "strong"
                          ? "text-green-400"
                          : passwordValidation.strength === "medium"
                            ? "text-yellow-500"
                            : "text-red-500"
                    }`}
                  >
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="new-password"
              required
            />

            {confirmPassword && registrationData.password !== confirmPassword && (
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
            disabled={!passwordValidation.isValid || registrationData.password !== confirmPassword}
          >
            Continue to Subscription <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
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
  );

  const renderConfirmationStep = () => (
    <Card className="story-card-intimate passionate-shimmer seductive-border">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <CardTitle className="text-2xl font-display font-bold text-passion-gradient">
          Welcome to Rude Gyal Confessions!
        </CardTitle>
        <CardDescription className="text-base font-serif text-muted-foreground mt-2">
          Your account has been created successfully
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">
              Account Created Successfully!
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              Email: {registrationData.email}
            </p>
            <p className="text-sm text-green-600 dark:text-green-300">
              Plan: {registrationData.selectedPlan?.name}
            </p>
            {registrationData.paymentMethod && (
              <p className="text-sm text-green-600 dark:text-green-300">
                Payment: Processed successfully
              </p>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>You'll be redirected to your dashboard in a moment...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-desire-gradient opacity-10 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {currentStep !== "subscription" && onNavigateToAuth && (
          <div className="text-center mb-8">
            <button
              onClick={onNavigateToAuth}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>
          </div>
        )}

        {currentStep !== "subscription" && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep === "account" ? "1" : "3"} of 3</span>
              <span>{getStepProgress()}% Complete</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        )}

        {currentStep === "account" && renderAccountStep()}
        {currentStep === "subscription" && (
          <SubscriptionPlan
            onPlanSelected={handlePlanSelected}
            onBack={() => setCurrentStep("account")}
            userEmail={registrationData.email}
          />
        )}
        {currentStep === "confirmation" && renderConfirmationStep()}
      </div>
    </div>
  );
}
