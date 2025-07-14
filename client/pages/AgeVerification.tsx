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
import { Calendar, Shield, Users, Star } from "lucide-react";

interface AgeVerificationProps {
  onVerified: () => void;
}

export default function AgeVerification({ onVerified }: AgeVerificationProps) {
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");

  const handleVerification = () => {
    if (!birthDate) {
      setError("Please enter your date of birth");
      return;
    }

    const birth = new Date(birthDate);
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
      setError("You must be 18 or older to access this content");
      return;
    }

    setError("");
    onVerified();
  };

  const handleExit = () => {
    window.location.href = "https://google.com";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F9a930541b2654097be9377fff1612aa0%2F6532a2d2c5444a69b0f8c5b4757e7b05?format=webp&width=800"
              alt="Rude Gyal Confessions Logo"
              className="h-12 w-12 object-contain"
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Rude Gyal Confessions
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Authentic confessions and intimate stories from real experiences -
            where bold voices share their truth
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Age verification card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">
                Age Verification Required
              </CardTitle>
              <CardDescription className="text-base">
                This site contains adult content. You must be 18 or older to
                continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="birthdate">Date of Birth</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="bg-input/50"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleVerification}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Calendar className="h-4 w-4 mr-2" />I am 18 or older
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExit}
                  className="flex-1"
                >
                  Exit Site
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>
                  By continuing, you confirm that you are of legal age and
                  consent to viewing adult content.
                </p>
                <p>
                  We respect your privacy and never store birth date
                  information.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Platform features */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              What awaits you:
            </h2>

            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-card/30 border border-border/30">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Premium Stories
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Access exclusive adult fiction from renowned authors with
                    immersive storytelling
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-card/30 border border-border/30">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Community Features
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Rate, comment, and engage with a community of adult fiction
                    enthusiasts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-card/30 border border-border/30">
                <div className="w-10 h-10 bg-premium/10 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-premium" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Tiered Access
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Free stories available, premium subscription for exclusive
                    content and features
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Join thousands of readers enjoying quality adult fiction
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Rudegyaljm.com - All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
