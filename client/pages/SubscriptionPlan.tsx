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
import {
  ArrowLeft,
  Crown,
  Heart,
  Flame,
  Star,
  CheckCircle,
  CreditCard,
  Lock,
} from "lucide-react";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
  type: "free" | "premium" | "vip";
}

const plans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free Access",
    price: 0,
    interval: "forever",
    type: "free",
    features: [
      "Access to free stories",
      "Basic content library",
      "Community features",
      "Standard support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 9.99,
    interval: "month",
    type: "premium",
    popular: true,
    features: [
      "All free features",
      "Access to premium stories",
      "Exclusive audio content",
      "Ad-free experience",
      "Priority support",
      "Early access to new content",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    price: 19.99,
    interval: "month",
    type: "vip",
    features: [
      "All premium features",
      "VIP-exclusive stories",
      "Custom story requests",
      "Direct author interaction",
      "Monthly video calls",
      "Personalized content",
    ],
  },
];

interface SubscriptionPlanProps {
  onPlanSelected: (plan: SubscriptionPlan, paymentMethod?: any) => void;
  onBack?: () => void;
  userEmail?: string;
}

export default function SubscriptionPlan({
  onPlanSelected,
  onBack,
  userEmail,
}: SubscriptionPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
  });

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    if (plan.price === 0) {
      // Free plan - no payment needed
      onPlanSelected(plan);
    } else {
      // Paid plan - show payment form
      setShowPayment(true);
    }
  };

  const simulateStripePayment = async (): Promise<{
    success: boolean;
    paymentIntentId?: string;
    error?: string;
  }> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate payment validation
    const { cardNumber, expiryDate, cvv, holderName } = paymentData;

    // Basic validation
    if (!cardNumber || cardNumber.length < 16) {
      return { success: false, error: "Invalid card number" };
    }
    if (!expiryDate || expiryDate.length < 5) {
      return { success: false, error: "Invalid expiry date" };
    }
    if (!cvv || cvv.length < 3) {
      return { success: false, error: "Invalid CVV" };
    }
    if (!holderName.trim()) {
      return { success: false, error: "Cardholder name required" };
    }

    // Simulate some cards that will fail for testing
    if (cardNumber.includes("0000")) {
      return { success: false, error: "Your card was declined" };
    }
    if (cardNumber.includes("1111")) {
      return { success: false, error: "Insufficient funds" };
    }

    // Success case
    return {
      success: true,
      paymentIntentId: `pi_simulated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);

    try {
      console.log("🔄 [STRIPE SIM] Processing payment for:", selectedPlan.name);
      console.log("🔄 [STRIPE SIM] Amount:", selectedPlan.price);
      console.log("🔄 [STRIPE SIM] User:", userEmail);

      const result = await simulateStripePayment();

      if (result.success) {
        console.log(
          "✅ [STRIPE SIM] Payment successful:",
          result.paymentIntentId,
        );

        // Include payment simulation data
        const paymentMethod = {
          type: "simulated_stripe",
          paymentIntentId: result.paymentIntentId,
          amount: selectedPlan.price,
          currency: "usd",
          cardLast4: paymentData.cardNumber.slice(-4),
          timestamp: new Date().toISOString(),
        };

        onPlanSelected(selectedPlan, paymentMethod);
      } else {
        console.error("❌ [STRIPE SIM] Payment failed:", result.error);
        alert(`Payment failed: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ [STRIPE SIM] Payment error:", error);
      alert("Payment processing error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  if (showPayment && selectedPlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-desire-gradient opacity-10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />

        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <button
              onClick={() => setShowPayment(false)}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Plans
            </button>
          </div>

          <Card className="story-card-intimate passionate-shimmer seductive-border">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-seductive-gradient rounded-full flex items-center justify-center mb-4 passionate-glow">
                <CreditCard className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-display font-bold text-passion-gradient">
                Complete Your Purchase
              </CardTitle>
              <CardDescription className="text-base font-serif text-muted-foreground mt-2">
                {selectedPlan.name} - ${selectedPlan.price}/
                {selectedPlan.interval}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Stripe Simulation Mode
                  </span>
                </div>
                <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                  This is a test environment. No real charges will be made.
                </p>
                <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                  <strong>Test cards:</strong> Use 4242424242424242 for success,
                  4000000000000000 for decline
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePayment();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    value={paymentData.cardNumber}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        cardNumber: formatCardNumber(e.target.value),
                      })
                    }
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="text"
                      placeholder="MM/YY"
                      value={paymentData.expiryDate}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          expiryDate: formatExpiryDate(e.target.value),
                        })
                      }
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      value={paymentData.cvv}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          cvv: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="holderName">Cardholder Name</Label>
                  <Input
                    id="holderName"
                    type="text"
                    placeholder="John Doe"
                    value={paymentData.holderName}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        holderName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? "Processing Payment..."
                    : `Pay $${selectedPlan.price}`}
                </Button>
              </form>
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

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {onBack && (
          <div className="text-center mb-8">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-passion-gradient mb-4">
            Choose Your Experience
          </h1>
          <p className="text-xl font-serif text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan to unlock your desires and explore exclusive
            content
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`story-card-intimate passionate-shimmer seductive-border relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                plan.popular ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handlePlanSelect(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <div
                  className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 passionate-glow ${
                    plan.type === "free"
                      ? "bg-gray-500/20"
                      : plan.type === "premium"
                        ? "bg-primary/20"
                        : "bg-yellow-500/20"
                  }`}
                >
                  {plan.type === "free" && (
                    <Heart className="h-8 w-8 text-gray-500" />
                  )}
                  {plan.type === "premium" && (
                    <Crown className="h-8 w-8 text-primary" />
                  )}
                  {plan.type === "vip" && (
                    <Flame className="h-8 w-8 text-yellow-500" />
                  )}
                </div>
                <CardTitle className="text-2xl font-display font-bold text-passion-gradient">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    /{plan.interval}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.type === "free"
                      ? "bg-gray-600 hover:bg-gray-700"
                      : plan.popular
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-secondary hover:bg-secondary/90"
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  {plan.price === 0 ? "Get Started Free" : "Choose This Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            All plans include 24/7 customer support and can be cancelled anytime
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>🔒 Secure payments with Stripe</span>
            <span>💳 All major cards accepted</span>
            <span>🔄 Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
