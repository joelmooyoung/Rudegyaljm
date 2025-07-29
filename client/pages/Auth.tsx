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
  onNavigateToForgotPassword?: () => void;
}

export default function Auth({
  onAuthenticated,
  onNavigateToForgotPassword,
}: AuthProps) {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("🔓 Starting login process for:", loginData.email);
      setError("Attempting to login..."); // Temporary debug message

      // Test API connectivity first
      try {
        const testResponse = await fetch("/api/test-connectivity");
        if (!testResponse.ok) {
          throw new Error("API server not responding");
        }
        console.log("API connectivity confirmed");
      } catch (connectError) {
        // Safely log connectivity error
        try {
          console.error("API connectivity failed:", connectError);
        } catch (logError) {
          console.error("Error logging connectivity failure");
        }
        throw new Error("Cannot connect to server. Please try again later.");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      // Validate response object exists
      if (!response) {
        throw new Error("No response received from server");
      }

      console.log("Login response status:", response?.status || 'unknown');

      if (!response.ok) {
        // Declare errorMessage in outer scope to ensure accessibility
        let errorMessage;

        try {
          errorMessage = `Login failed (${response?.status || 'unknown'})`;

          // Check if response is JSON by looking at content-type
          const contentType = response?.headers?.get ? response.headers.get("content-type") : null;
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData?.message || errorMessage;
            console.log("Login error data:", errorData);
          } else {
            // Server returned non-JSON response (likely HTML error page)
            // Simplified logging - avoid complex operations that keep failing
            console.log("Server returned non-JSON error response");
            errorMessage = `Server error (${response?.status || 'unknown'}): ${response?.statusText || 'unknown error'}`;

            // Check if it's a common server error
            const statusCode = response?.status;
            if (statusCode === 502) {
              errorMessage =
                "Server temporarily unavailable. Please try again.";
            } else if (statusCode === 503) {
              errorMessage =
                "Service temporarily unavailable. Please try again later.";
            } else if (statusCode && statusCode >= 500) {
              errorMessage = "Internal server error. Please try again.";
            }
          }
        } catch (parseError) {
          // Safely log parse error
          try {
            console.error("Failed to parse error response:", parseError);
          } catch (logError) {
            console.error("Error logging parse error");
          }
          // Safely create error message with maximum defensive programming
          try {
            const status = (response && typeof response.status === 'number') ? response.status : "unknown";
            const statusText = (response && typeof response.statusText === 'string') ? response.statusText : "unknown error";
            errorMessage = "Server communication error (" + String(status) + "): " + String(statusText);
          } catch (templateError) {
            // Safely log error without risking additional errors
            try {
              console.error("Error creating error message:", templateError);
            } catch (logError) {
              console.error("Multiple error handling failures occurred");
            }
            errorMessage = "Server communication error occurred";
          }
        }

        // Ensure errorMessage has a value before throwing
        throw new Error(errorMessage || "Login failed with unknown error");
      }

      // Safely declare data variable with proper initialization
      let data = null;
      try {
        // Validate response object before processing successful response
        if (!response || typeof response !== 'object') {
          throw new Error("Invalid response object received");
        }

        // Check if successful response is JSON
        const contentType = response?.headers?.get ? response.headers.get("content-type") : null;
        if (!contentType || !contentType.includes("application/json")) {
          // Simplified logging - avoid complex string operations that keep failing
          console.error("Server returned non-JSON response, content-type:", contentType || "unknown");
          throw new Error("Server returned invalid response format");
        }

        // Safely parse JSON response
        if (!response.json || typeof response.json !== 'function') {
          throw new Error("Response object does not have json() method");
        }

        data = await response.json();

        // Safely log response data
        try {
          console.log("Login response data:", {
            success: data?.success,
            hasUser: !!data?.user,
          });
        } catch (logError) {
          console.error("Error logging response data");
        }
      } catch (parseError) {
        // Safely log JSON parsing error
        try {
          console.error("Failed to parse login response:", parseError);
        } catch (logError) {
          console.error("Error logging JSON parse failure");
        }
        // Safely check error message
        const errorMsg =
          parseError instanceof Error ? parseError.message : String(parseError);
        if (errorMsg.includes("JSON")) {
          throw new Error("Server returned invalid JSON response");
        }
        throw new Error("Invalid response from login server");
      }

      // Validate response data with comprehensive checks
      if (!data || typeof data !== "object") {
        throw new Error("Invalid response format from server");
      }

      if (!data.success) {
        const errorMsg = (data && typeof data.message === 'string') ? data.message : "Login was not successful";
        throw new Error(errorMsg);
      }

      if (!data.user || typeof data.user !== "object") {
        throw new Error("No user data received from server");
      }

      if (!data.user.username || typeof data.user.username !== "string") {
        throw new Error("Incomplete user data - missing username");
      }

      if (!data.token || typeof data.token !== "string") {
        throw new Error("No authentication token received");
      }

      console.log("Login successful for user:", data.user.username);
      localStorage.setItem("token", data.token);
      onAuthenticated(data.user);
    } catch (err) {
      console.error("🚨 Login error caught:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown login error";
      const finalErrorMessage = `Login failed: ${errorMessage}`;
      console.log("🔧 Setting error message:", finalErrorMessage);
      setError(finalErrorMessage);
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
            <span className="text-accent font-semibold">
              Rudegyalconfessions.com
            </span>
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
                        placeholder="••••••���•"
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

                  {/* Debug: Test error display functionality */}
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setError("🔧 Debug: Error display is working!")}
                      className="text-xs mb-2"
                    >
                      Test Error Display
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="text-center">
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
              © {new Date().getFullYear()} Rudegyalconfessions.com - All rights
              reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
