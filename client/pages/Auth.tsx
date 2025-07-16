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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Crown,
  Eye,
  EyeOff,
  Mail,
  User,
  Calendar,
  Heart,
  Flame,
  Lock,
} from "lucide-react";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User as UserType,
} from "@shared/api";

interface AuthProps {
  onAuthenticated: (user: UserType) => void;
}

export default function Auth({ onAuthenticated }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Login form state
  const [loginData, setLoginData] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState<RegisterRequest>({
    email: "",
    username: "",
    password: "",
    dateOfBirth: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSeedDatabase = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("🌱 Attempting to seed database...");

      const response = await fetch("/api/seed-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setError(
          "✅ Database seeded! Login with: admin@nocturne.com / admin123",
        );
        console.log("✅ Database seeding successful:", result);
      } else {
        setError("❌ Seeding failed: " + (result.message || "Unknown error"));
        console.error("❌ Database seeding failed:", result);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError("❌ Seeding error: " + errorMessage);
      console.error("❌ Database seeding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data: AuthResponse = await response.json();
      localStorage.setItem("token", data.token);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (registerData.password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Verify age
    const birth = new Date(registerData.dateOfBirth);
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
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data: AuthResponse = await response.json();
      localStorage.setItem("token", data.token);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Passionate background gradient */}
      <div className="absolute inset-0 bg-desire-gradient opacity-10 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 mb-6">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F9a930541b2654097be9377fff1612aa0%2F6532a2d2c5444a69b0f8c5b4757e7b05?format=webp&width=800"
              alt="Rude Gyal Confessions Logo"
              className="h-12 w-12 object-contain sultry-pulse"
            />
            <h1 className="text-4xl font-display font-bold text-passion-gradient">
              Rude Gyal Confessions
            </h1>
          </div>
          <p className="text-lg font-serif text-muted-foreground">
            <em>Your gateway to forbidden desires</em> awaits at{" "}
            <span className="text-accent font-semibold">Rudegyaljm.com</span>
          </p>
        </div>

        <Card className="story-card-intimate passionate-shimmer seductive-border">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-seductive-gradient rounded-full flex items-center justify-center mb-4 passionate-glow">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display font-bold text-passion-gradient">
              Welcome, Seeker of Desires
            </CardTitle>
            <CardDescription className="text-base font-serif text-muted-foreground mt-2">
              Enter your sanctuary of passion or begin your journey into
              temptation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 seductive-border bg-card/50">
                <TabsTrigger
                  value="login"
                  className="font-serif data-[state=active]:text-passion-gradient"
                >
                  {" "}
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="font-serif data-[state=active]:text-passion-gradient"
                >
                  {" "}
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="login-email"
                      className="text-base font-serif"
                    >
                      Your Secret Identity
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accent" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="whisper@yourdesires.com"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        className="pl-11 py-3 text-lg font-serif bg-input/80 seductive-border focus:passionate-glow transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="login-password"
                      className="text-base font-serif"
                    >
                      Your Secret Key
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accent" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            password: e.target.value,
                          })
                        }
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
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full mt-2 text-xs text-muted-foreground"
                    onClick={handleSeedDatabase}
                  >
                    🌱 Seed Database (First Time Setup)
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Choose a username"
                        value={registerData.username}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            username: e.target.value,
                          })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-birth">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-birth"
                        type="date"
                        value={registerData.dateOfBirth}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        className="pr-10"
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
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
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Crown className="h-4 w-4 text-premium" />
                <span>Premium features available after registration</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
