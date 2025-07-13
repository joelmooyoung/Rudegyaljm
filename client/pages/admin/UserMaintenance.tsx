import { useState } from "react";
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
  Users,
  Search,
  Crown,
  ArrowLeft,
  Edit3,
  Trash2,
  Shield,
  Calendar,
} from "lucide-react";

interface UserMaintenanceProps {
  onBack: () => void;
}

export default function UserMaintenance({ onBack }: UserMaintenanceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                User Maintenance
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
              <SelectItem value="premium">Premium Users</SelectItem>
              <SelectItem value="free">Free Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Management Content */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts, roles, and subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">User Management</h3>
              <p className="text-muted-foreground mb-6">
                Administrators can manage user accounts, change roles, and
                handle subscriptions
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-card/50">
                  <CardContent className="p-4 text-center">
                    <Shield className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <div className="text-2xl font-bold">1</div>
                    <div className="text-sm text-muted-foreground">Admins</div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4 text-center">
                    <Crown className="h-8 w-8 text-premium mx-auto mb-2" />
                    <div className="text-2xl font-bold">1</div>
                    <div className="text-sm text-muted-foreground">
                      Premium Users
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-2xl font-bold">1</div>
                    <div className="text-sm text-muted-foreground">
                      Free Users
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 text-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold">3</div>
                    <div className="text-sm text-muted-foreground">
                      Total Users
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center gap-2">
                <Button variant="outline">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit User Roles
                </Button>
                <Button variant="outline">
                  <Crown className="h-4 w-4 mr-2" />
                  Manage Subscriptions
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deactivate Users
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
