import { useState, useEffect } from "react";
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
  Users,
  Search,
  Crown,
  ArrowLeft,
  Edit3,
  Trash2,
  Shield,
  Calendar,
  Plus,
  UserCheck,
  UserX,
  Mail,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { User } from "@shared/api";

interface UserMaintenanceProps {
  onBack: () => void;
  onEditUser: (user: User | null, mode: "add" | "edit") => void;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  premium: number;
  free: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
}

export default function UserMaintenance({
  onBack,
  onEditUser,
}: UserMaintenanceProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from server
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersResponse, statsResponse] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/users/stats"),
      ]);

      if (usersResponse.ok && statsResponse.ok) {
        const usersResponse_data = await usersResponse.json();
        const statsData = await statsResponse.json();

        // Extract users array from API response
        const usersData = usersResponse_data.success
          ? usersResponse_data.data
          : usersResponse_data;

        // Convert date strings back to Date objects
        const usersWithDates = (usersData || []).map((user: any) => ({
          ...user,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
          subscriptionExpiry: user.subscriptionExpiry
            ? new Date(user.subscriptionExpiry)
            : undefined,
        }));
        setUsers(usersWithDates);
        setStats(statsData);
      } else {
        const errorMsg = `Failed to fetch users: ${usersResponse.status} ${usersResponse.statusText}`;
        setError(errorMsg);
      }
    } catch (error) {
      const errorMsg = `Network error: ${error instanceof Error ? error.message : "Unknown error"}`;
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleUserActive = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/toggle-active`, {
        method: "PATCH",
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(
          users.map((user) =>
            user.id === userId
              ? {
                  ...updatedUser,
                  createdAt: new Date(updatedUser.createdAt),
                  lastLogin: updatedUser.lastLogin
                    ? new Date(updatedUser.lastLogin)
                    : undefined,
                  subscriptionExpiry: updatedUser.subscriptionExpiry
                    ? new Date(updatedUser.subscriptionExpiry)
                    : undefined,
                }
              : user,
          ),
        );
        // Refresh stats
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to toggle user status");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("Error toggling user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers(users.filter((user) => user.id !== userId));
        // Refresh stats
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
  };

  const renderUserCard = (user: User) => (
    <Card
      key={user.id}
      className="story-card-intimate cursor-pointer group overflow-hidden"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-display font-bold leading-tight group-hover:text-passion-gradient transition-colors duration-300">
                {user.username}
              </CardTitle>
              <Badge
                variant={user.isActive ? "default" : "destructive"}
                className={
                  user.isActive
                    ? "bg-seductive-gradient passionate-glow font-semibold"
                    : "bg-destructive font-semibold"
                }
              >
                {user.isActive ? (
                  <UserCheck className="h-3 w-3 mr-1" />
                ) : (
                  <UserX className="h-3 w-3 mr-1" />
                )}
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <CardDescription className="font-serif text-sm">
              <Mail className="h-3 w-3 inline mr-1" />
              {user.email}
            </CardDescription>
          </div>
          <Badge
            variant={user.role === "admin" ? "destructive" : "default"}
            className={
              user.role === "admin"
                ? "bg-destructive text-destructive-foreground"
                : user.role === "premium"
                  ? "bg-seductive-gradient text-primary-foreground passionate-glow"
                  : "bg-free-badge text-background"
            }
          >
            {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
            {user.role === "premium" && <Crown className="h-3 w-3 mr-1" />}
            {user.role === "admin"
              ? "Admin"
              : user.role === "premium"
                ? "Premium"
                : "Free"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Details */}
        <div className="space-y-2 text-sm font-serif text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Created:</span>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last Login:</span>
            <span>
              {user.lastLogin
                ? new Date(user.lastLogin).toLocaleDateString()
                : "Never"}
            </span>
          </div>
          {user.subscriptionStatus !== "none" && (
            <div className="flex items-center justify-between">
              <span>Subscription:</span>
              <Badge
                variant="outline"
                className={`text-xs ${
                  user.subscriptionStatus === "active"
                    ? "text-green-500 border-green-500"
                    : "text-red-500 border-red-500"
                }`}
              >
                {user.subscriptionStatus}
              </Badge>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditUser(user, "edit")}
            className="flex-1 seductive-border"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleUserActive(user.id)}
            className={user.isActive ? "text-destructive" : "text-green-500"}
          >
            {user.isActive ? (
              <UserX className="h-3 w-3" />
            ) : (
              <UserCheck className="h-3 w-3" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <strong>{user.username}</strong>? This action cannot be undone
                  and will remove all user data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteUser(user.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );

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
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-display font-bold text-passion-gradient">
                User Maintenance
              </h1>
              <Badge variant="secondary" className="ml-2">
                {filteredUsers.length} users
              </Badge>
            </div>
            <Button
              onClick={() => onEditUser(null, "add")}
              className="btn-seductive"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="story-card-intimate">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-passion-gradient">
                  {stats.total}
                </div>
                <div className="text-sm font-serif text-muted-foreground">
                  Total Users
                </div>
              </CardContent>
            </Card>
            <Card className="story-card-intimate">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-destructive mx-auto mb-2" />
                <div className="text-2xl font-bold text-passion-gradient">
                  {stats.admins}
                </div>
                <div className="text-sm font-serif text-muted-foreground">
                  Administrators
                </div>
              </CardContent>
            </Card>
            <Card className="story-card-intimate">
              <CardContent className="p-6 text-center">
                <Crown className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-passion-gradient">
                  {stats.premium}
                </div>
                <div className="text-sm font-serif text-muted-foreground">
                  Premium Users
                </div>
              </CardContent>
            </Card>
            <Card className="story-card-intimate">
              <CardContent className="p-6 text-center">
                <UserCheck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-passion-gradient">
                  {stats.active}
                </div>
                <div className="text-sm font-serif text-muted-foreground">
                  Active Users
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 seductive-border font-serif"
            />
          </div>
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48 seductive-border font-serif">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">👑 Administrators</SelectItem>
                <SelectItem value="premium">💎 Premium Users</SelectItem>
                <SelectItem value="free">🆓 Free Users</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 seductive-border font-serif">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Grid */}
        <div className="max-h-[70vh] overflow-y-auto">
          {error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Failed to load users
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchUsers} className="btn-seductive">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4 sultry-pulse"></div>
              <p className="text-muted-foreground font-serif">
                Loading users...
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map(renderUserCard)}
            </div>
          )}

          {!isLoading && !error && filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 font-display">
                No users found
              </h3>
              <p className="text-muted-foreground font-serif mb-4">
                {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No users have been created yet"}
              </p>
              <Button
                onClick={() => onEditUser(null, "add")}
                className="btn-seductive"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First User
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
