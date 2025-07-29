import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Mail, Lock, Eye, EyeOff, Crown } from "lucide-react";

interface User {
  id: string;
  email: string;
  username: string;
  role: "admin" | "premium" | "free";
  isActive: boolean;
  isAgeVerified: boolean;
  subscriptionStatus: "active" | "none";
  createdAt: Date;
  lastLogin?: Date;
}

interface SimpleAuthProps {
  onAuthenticated: (user: User) => void;
  onNavigateToForgotPassword: () => void;
}

export default function SimpleAuth({
  onAuthenticated,
  onNavigateToForgotPassword,
}: SimpleAuthProps) {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerDateOfBirth, setRegisterDateOfBirth] = useState("");

  // Simple login function with robust debugging
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use alerts to ensure we can see what's happening
    alert("🔧 Login form submitted - starting debug process");

    setIsLoading(true);
    setError("");

    try {
      // Alert and set error message
      alert("📡 Testing API connection...");
      setError("📡 Testing API connection...");

      try {
        const pingResponse = await fetch("/api/ping");
        if (!pingResponse.ok) {
          const msg = `❌ API not reachable - ping returned ${pingResponse.status}`;
          alert(msg);
          setError(msg);
          return;
        }

        const msg = "✅ API connected, attempting login...";
        alert(msg);
        setError(msg);
      } catch (pingError) {
        const msg = "❌ Cannot reach API server - network error";
        alert(msg);
        setError(msg);
        return;
      }

      alert(`📤 Sending login request for: ${loginEmail}`);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const statusMsg = `📥 Login API responded with status: ${response.status}`;
      alert(statusMsg);
      setError(statusMsg);

      const data = await response.json();

      // Show full response data for debugging
      const fullResponseMsg = `📊 Full API Response: ${JSON.stringify(data, null, 2)}`;
      alert(fullResponseMsg);
      console.log("[DEBUGGING] Full API Response:", data);

      // Show detailed response info
      const detailMsg = `📊 Response details: status=${response.status}, ok=${response.ok}, success=${!!data.success}, user=${!!data.user}, token=${!!data.token}`;
      alert(detailMsg);
      setError(detailMsg);

      if (!response.ok) {
        const errorMsg = data.message || `Login failed (${response.status})`;
        alert(`❌ API Error: ${errorMsg}`);
        setError(`❌ API Error: ${errorMsg} | Full response: ${JSON.stringify(data)}`);
        return;
      }

      if (data.success && data.user && data.token) {
        alert("🎉 Login successful! Redirecting...");
        localStorage.setItem("token", data.token);
        onAuthenticated(data.user);
      } else {
        const missingMsg = `❌ Missing fields - success: ${!!data.success}, user: ${!!data.user}, token: ${!!data.token}`;
        alert(missingMsg);
        setError(missingMsg);
      }
    } catch (err) {
      const errorMsg = `❌ Network error: ${err.message}`;
      alert(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Test database connectivity
  const testDatabase = async () => {
    // Immediate feedback
    alert("🔍 Test DB button clicked!");
    setError("🔍 Testing database...");
    setIsLoading(true);

    try {
      alert("📡 Fetching /api/test-db...");
      const response = await fetch("/api/test-db");

      alert(`📥 Response status: ${response.status}`);
      const data = await response.json();

      alert(`📊 Response data: ${JSON.stringify(data)}`);

      if (data.success) {
        const msg = `✅ Database connected! Found ${data.userCount} users in database`;
        alert(msg);
        setError(msg);
      } else {
        const msg = `❌ Database error: ${data.message}`;
        alert(msg);
        setError(msg);
      }
    } catch (err) {
      const msg = `❌ Cannot reach database API: ${err.message}`;
      alert(msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Create admin user for testing
  const createAdminUser = async () => {
    // Immediate feedback
    alert("🔧 Create Admin button clicked!");
    setError("🔧 Creating admin user...");
    setIsLoading(true);

    try {
      alert("📡 Fetching /api/create-admin...");
      const response = await fetch("/api/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      alert(`📥 Response status: ${response.status}`);
      const data = await response.json();

      alert(`📊 Response data: ${JSON.stringify(data)}`);

      if (data.success) {
        const msg = `✅ ${data.message} - You can now login with admin@nocturne.com / admin123`;
        alert(msg);
        setError(msg);
      } else {
        const msg = `❌ Failed to create admin: ${data.message}`;
        alert(msg);
        setError(msg);
      }
    } catch (err) {
      const msg = `❌ Failed to create admin user: ${err.message}`;
      alert(msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple register function
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          username: registerUsername,
          password: registerPassword,
          dateOfBirth: registerDateOfBirth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      if (data.success && data.user) {
        localStorage.setItem("token", data.token);
        onAuthenticated(data.user);
      } else {
        setError("Invalid registration response");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-desire-gradient opacity-10 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Header */}
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
            <span className="text-accent font-semibold">
              Rudegyalconfessions.com
            </span>
          </p>
        </div>

        {/* Auth Card */}
        <Card className="story-card-intimate passionate-shimmer seductive-border">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-seductive-gradient rounded-full flex items-center justify-center mb-4 passionate-glow">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display font-bold text-passion-gradient">
              Welcome, Seeker of Desires
            </CardTitle>
            <p className="text-base font-serif text-muted-foreground mt-2">
              Enter your sanctuary of passion or begin your journey into
              temptation
            </p>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 seductive-border bg-card/50">
                <TabsTrigger
                  value="login"
                  className="font-serif data-[state=active]:text-passion-gradient"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="font-serif data-[state=active]:text-passion-gradient"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
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
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 bg-card/50 border-accent/30 focus:border-accent focus:passionate-glow transition-all duration-300"
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
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-12 bg-card/50 border-accent/30 focus:border-accent focus:passionate-glow transition-all duration-300"
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

                  <div className="text-center space-y-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      Database Error Detected - Try these test credentials:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLoginEmail("joelmooyoung@me.com");
                          setLoginPassword("admin123");
                        }}
                        className="text-xs"
                      >
                        📧 Joel's Account
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLoginEmail("admin@nocturne.com");
                          setLoginPassword("admin123");
                        }}
                        className="text-xs"
                      >
                        👑 Admin Account
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={onNavigateToForgotPassword}
                      className="text-sm text-accent hover:text-accent/80 font-medium underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </TabsContent>

              {/* Register Tab */}
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
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a username"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-dob">Date of Birth</Label>
                    <Input
                      id="register-dob"
                      type="date"
                      value={registerDateOfBirth}
                      onChange={(e) => setRegisterDateOfBirth(e.target.value)}
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
              © {new Date().getFullYear()} Rudegyalconfessions.com - All rights
              reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
