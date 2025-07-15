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
import { Calendar, Shield, Users, Star, Flame, Heart, Eye } from "lucide-react";

interface AgeVerificationProps {
  onVerified: () => void;
}

export default function AgeVerification({ onVerified }: AgeVerificationProps) {
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");

  // Development bypass - uncomment for testing
  // React.useEffect(() => {
  //   onVerified();
  // }, [onVerified]);

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
    <div
      className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#0f172a", color: "white" }}
    >
      {/* Passionate background gradient */}
      <div className="absolute inset-0 bg-desire-gradient opacity-10 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 mb-6">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F9a930541b2654097be9377fff1612aa0%2F6532a2d2c5444a69b0f8c5b4757e7b05?format=webp&width=800"
              alt="Rude Gyal Confessions Logo"
              className="h-16 w-16 object-contain sultry-pulse"
            />
            <h1
              className="text-5xl font-display font-bold text-passion-gradient"
              style={{ color: "#ef4444", fontSize: "3rem" }}
            >
              Rude Gyal Confessions
            </h1>
          </div>
          <p
            className="text-2xl font-serif text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            style={{ color: "#d1d5db", fontSize: "1.5rem" }}
          >
            <em>Where forbidden desires meet bold confessions</em> - Enter a
            realm of authentic passion, intimate secrets, and stories that
            ignite the soul
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Age verification card */}
          <Card className="story-card-intimate passionate-shimmer seductive-border">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-seductive-gradient rounded-full flex items-center justify-center mb-6 passionate-glow">
                <Flame className="h-10 w-10 text-primary-foreground" />
              </div>
              <CardTitle className="text-3xl font-display font-bold text-passion-gradient mb-3">
                Enter the Forbidden Realm
              </CardTitle>
              <CardDescription className="text-lg font-serif text-muted-foreground leading-relaxed">
                This sanctuary contains adult tales of desire and passion.
                <br />
                You must be <strong className="text-accent">
                  18 or older
                </strong>{" "}
                to witness these intimate confessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="birthdate" className="text-lg font-serif">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Reveal Your Age
                </Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="bg-input/80 seductive-border py-3 text-lg font-serif focus:passionate-glow transition-all duration-300"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg font-serif">
                  <Flame className="inline h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handleVerification}
                  className="flex-1 btn-seductive py-3 text-lg font-semibold"
                >
                  <Heart className="h-5 w-5 mr-2" />I am 18+ - Enter Paradise
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExit}
                  className="flex-1 py-3 text-lg font-serif seductive-border"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Exit
                </Button>
              </div>

              <div className="text-sm font-serif text-muted-foreground text-center space-y-2 italic">
                <p>
                  By entering, you confirm that you are of legal age and
                  willingly consent to experiencing passionate adult content.
                </p>
                <p>
                  Your privacy is sacred - we never store personal information.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Platform features */}
          <div className="space-y-8">
            <h2 className="text-3xl font-display font-bold text-passion-gradient text-center">
              What Awaits Your Desire:
            </h2>

            <div className="grid gap-6">
              <div className="flex items-start gap-4 p-6 rounded-lg story-card-intimate seductive-border">
                <div className="w-12 h-12 bg-seductive-gradient rounded-lg flex items-center justify-center passionate-glow">
                  <Flame className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold text-passion-gradient mb-2">
                    Intoxicating Tales
                  </h3>
                  <p className="text-base font-serif text-muted-foreground leading-relaxed">
                    Immerse yourself in exclusive stories of passion, desire,
                    and forbidden romance crafted by master storytellers who
                    understand the art of seduction.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-lg story-card-intimate seductive-border">
                <div className="w-12 h-12 bg-seductive-gradient rounded-lg flex items-center justify-center passionate-glow">
                  <Heart className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold text-passion-gradient mb-2">
                    Passionate Community
                  </h3>
                  <p className="text-base font-serif text-muted-foreground leading-relaxed">
                    Share your desires, whisper your secrets, and connect with
                    kindred souls who appreciate the beauty of erotic
                    storytelling.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-lg story-card-intimate seductive-border">
                <div className="w-12 h-12 bg-seductive-gradient rounded-lg flex items-center justify-center passionate-glow">
                  <Eye className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold text-passion-gradient mb-2">
                    Layers of Pleasure
                  </h3>
                  <p className="text-base font-serif text-muted-foreground leading-relaxed">
                    Begin with tantalizing free stories, then unlock the vault
                    of premium desires for the most intimate and forbidden
                    tales.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-6">
              <p className="text-lg font-serif text-muted-foreground italic">
                Join thousands of passionate souls already lost in our realm of
                desire...
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
