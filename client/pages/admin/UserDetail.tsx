import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Crown,
  Shield,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Mail,
  UserCheck,
  UserX,
  Trash2,
  Key,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { User as UserType, UserUpdateRequest } from "@shared/api";

interface UserDetailProps {
  user: UserType | null;
  currentAdminUser?: UserType | null;
  mode: "add" | "edit";
  onBack: () => void;
  onSave: (userData: Partial<UserType>) => Promise<void>;
  onDelete?: (userId: string) => Promise<void>;
}

export default function UserDetail({
  user,
  currentAdminUser,
  mode,
  onBack,
  onSave,
  onDelete,
}: UserDetailProps) {
  const [formData, setFormData] = useState<UserUpdateRequest>({
    email: "",
    username: "",
    role: "free",
    isActive: true,
    subscriptionStatus: "none",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Memoize form change handlers to prevent delays
  const handleRoleChange = useCallback((value: "admin" | "premium" | "free") => {
    setFormData(prev => ({ ...prev, role: value }));
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, email: e.target.value }));
  }, []);

  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, username: e.target.value }));
  }, []);

  const handleActiveChange = useCallback((checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  }, []);

  const handleSubscriptionStatusChange = useCallback((value: "active" | "expired" | "none") => {
    setFormData(prev => ({ ...prev, subscriptionStatus: value }));
  }, []);

  const handleSubscriptionExpiryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      subscriptionExpiry: e.target.value ? new Date(e.target.value) : undefined,
    }));
  }, []);

  useEffect(() => {
    if (user && mode === "edit") {
      setFormData({
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
      });
    } else if (mode === "add") {
      setFormData({
        email: "",
        username: "",
        role: "free",
        isActive: true,
        subscriptionStatus: "none",
      });
    }
  }, [user, mode]);

  const handleSave = async () => {
    setError("");
    setIsLoading(true);

    try {
      // Validation
      if (!formData.email || !formData.username) {
        setError("Email and username are required");
        return;
      }

      if (mode === "add" && !password) {
        setError("Password is required for new users");
        return;
      }

      if (password && password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password && password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      const userData: Partial<UserType> = {
        ...formData,
        ...(password && { password }),
        // Include user ID for edit mode
        ...(mode === "edit" && user?.id && { id: user.id }),
      };

      console.log("Saving user data:", {
        mode,
        userId: user?.id,
        hasPassword: !!password,
        userData: {
          ...userData,
          password: password ? "[REDACTED]" : undefined,
        },
      });

      await onSave(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !onDelete) return;

    setIsLoading(true);
    try {
      await onDelete(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

  const generateStrongPassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    // Ensure at least one character from each category
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = password.length; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setPassword(generated);
    setConfirmPassword(generated);
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
              <User className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-display font-bold text-passion-gradient">
                {mode === "add"
                  ? "Add New User"
                  : `Edit User: ${user?.username}`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {mode === "edit" && user && (
                <Badge
                  variant={user.isActive ? "default" : "destructive"}
                  className={
                    user.isActive
                      ? "bg-seductive-gradient passionate-glow"
                      : "bg-destructive"
                  }
                >
                  {user.isActive ? (
                    <UserCheck className="h-3 w-3 mr-1" />
                  ) : (
                    <UserX className="h-3 w-3 mr-1" />
                  )}
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="story-card-intimate seductive-border">
            <CardHeader>
              <CardTitle className="text-xl font-display font-bold text-passion-gradient">
                User Information
              </CardTitle>
              <CardDescription className="font-serif">
                {mode === "add"
                  ? "Create a new user account with the specified details"
                  : "Modify user account details and permissions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg font-serif">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-display font-semibold text-passion-gradient">
                  Basic Information
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-serif">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      className="seductive-border font-serif"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="font-serif">
                      <User className="inline h-4 w-4 mr-2" />
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={handleUsernameChange}
                      className="seductive-border font-serif"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="font-serif">
                      <Shield className="inline h-4 w-4 mr-2" />
                      User Role
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: "admin" | "premium" | "free") =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger className="seductive-border font-serif">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">🆓 Free User</SelectItem>
                        <SelectItem value="premium">💎 Premium User</SelectItem>
                        <SelectItem value="admin">👑 Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-serif">Account Status</Label>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-card/50 seductive-border">
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isActive: checked })
                        }
                      />
                      <span className="font-serif">
                        {formData.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-display font-semibold text-passion-gradient">
                      {mode === "add" ? "Set Password" : "Change Password"}
                    </h3>
                    <p className="text-sm font-serif text-muted-foreground">
                      {mode === "add"
                        ? "Set a secure password for the new user account"
                        : "Leave blank to keep current password unchanged"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePassword}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Strong Password
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-serif">
                      {mode === "add" ? "Password" : "New Password"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="seductive-border font-serif pr-10"
                        placeholder={
                          mode === "add"
                            ? "••••••••"
                            : "Leave blank to keep current"
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
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
                    <Label htmlFor="confirmPassword" className="font-serif">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="seductive-border font-serif"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              {(formData.role === "premium" ||
                user?.subscriptionStatus !== "none") && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-semibold text-passion-gradient">
                    Subscription Details
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="subscriptionStatus"
                        className="font-serif"
                      >
                        <Crown className="inline h-4 w-4 mr-2" />
                        Subscription Status
                      </Label>
                      <Select
                        value={formData.subscriptionStatus}
                        onValueChange={(value: "active" | "expired" | "none") =>
                          setFormData({
                            ...formData,
                            subscriptionStatus: value,
                          })
                        }
                      >
                        <SelectTrigger className="seductive-border font-serif">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Subscription</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.subscriptionStatus === "active" && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="subscriptionExpiry"
                          className="font-serif"
                        >
                          <Calendar className="inline h-4 w-4 mr-2" />
                          Expiry Date
                        </Label>
                        <Input
                          id="subscriptionExpiry"
                          type="date"
                          value={
                            formData.subscriptionExpiry
                              ? new Date(formData.subscriptionExpiry)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subscriptionExpiry: e.target.value
                                ? new Date(e.target.value)
                                : undefined,
                            })
                          }
                          className="seductive-border font-serif"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata (Edit mode only) */}
              {mode === "edit" && user && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display font-semibold text-passion-gradient">
                    Account Information
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4 text-sm font-serif text-muted-foreground">
                    <div>
                      <span className="font-semibold">Created:</span>{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-semibold">Last Login:</span>{" "}
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </div>
                    <div>
                      <span className="font-semibold">User ID:</span> {user.id}
                    </div>
                    <div>
                      <span className="font-semibold">Age Verified:</span>{" "}
                      {user.isAgeVerified ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-6">
                <div className="flex gap-3">
                  {mode === "edit" && user && onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>{user.username}</strong>? This action cannot
                            be undone and will remove all user data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="btn-seductive"
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {mode === "add" ? "Create User" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
