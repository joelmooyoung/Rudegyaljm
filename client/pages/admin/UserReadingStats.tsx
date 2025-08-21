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
  ArrowLeft,
  BookOpen,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  Search,
  Loader2,
  Trophy,
  Target,
  Activity,
} from "lucide-react";

interface UserReadingStatsProps {
  onBack: () => void;
}

interface UserStats {
  _id: string;
  username: string;
  totalReads: number;
  uniqueStoriesCount: number;
  firstRead: string;
  lastRead: string;
}

interface PlatformStats {
  totalReads: number;
  uniqueUsersCount: number;
  uniqueStoriesCount: number;
}

interface WeeklyActivity {
  _id: string;
  totalReads: number;
  uniqueUsersCount: number;
}

export default function UserReadingStats({ onBack }: UserReadingStatsProps) {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalReads: 0,
    uniqueUsersCount: 0,
    uniqueStoriesCount: 0,
  });
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("totalReads");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUserStats = async (page = 1, search = "") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });

      const response = await fetch(`/api/admin/user-reading-stats?${params}`);
      if (response.ok) {
        const data = await response.json();
        let filteredUsers = data.data.users || [];

        // Client-side search filtering
        if (search) {
          filteredUsers = filteredUsers.filter(
            (user: UserStats) =>
              user.username.toLowerCase().includes(search.toLowerCase()) ||
              user._id.toLowerCase().includes(search.toLowerCase()),
          );
        }

        // Client-side sorting
        filteredUsers.sort((a: UserStats, b: UserStats) => {
          if (sortBy === "totalReads") return b.totalReads - a.totalReads;
          if (sortBy === "uniqueStories")
            return b.uniqueStoriesCount - a.uniqueStoriesCount;
          if (sortBy === "lastRead") {
            try {
              const dateA = new Date(a.lastRead);
              const dateB = new Date(b.lastRead);
              if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                console.warn("Invalid date found in lastRead:", { a: a.lastRead, b: b.lastRead });
                return 0; // Keep original order if dates are invalid
              }
              return dateB.getTime() - dateA.getTime();
            } catch (error) {
              console.warn("Error parsing lastRead dates:", error);
              return 0;
            }
          }
          if (sortBy === "username")
            return a.username.localeCompare(b.username);
          return 0;
        });

        setUsers(filteredUsers);
        setPlatformStats(data.data.platformStats);
        setWeeklyActivity(data.data.weeklyActivity || []);
        setTotalPages(data.data.pagination?.pages || 1);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch user reading stats");
      }
    } catch (error) {
      console.error("Error fetching user reading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats(currentPage, searchTerm);
  }, [currentPage, sortBy]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUserStats(1, searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTopReaders = () => {
    return users.slice(0, 5);
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
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                User Reading Statistics
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Platform Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Story Reads
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {platformStats.totalReads.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                All-time story views by logged-in users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Readers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {platformStats.uniqueUsersCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Users who have read at least one story
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Stories Read
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {platformStats.uniqueStoriesCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Different stories that have been read
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Activity */}
        {weeklyActivity.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Weekly Reading Activity
              </CardTitle>
              <CardDescription>
                Story reads and active users for the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weeklyActivity.map((day) => (
                  <div
                    key={day._id}
                    className="text-center p-2 bg-muted/50 rounded"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {new Date(day._id).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </div>
                    <div className="text-lg font-bold">{day.totalReads}</div>
                    <div className="text-xs text-muted-foreground">
                      {day.uniqueUsersCount} users
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Readers */}
        {users.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Readers
              </CardTitle>
              <CardDescription>Users with the most story reads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getTopReaders().map((user, index) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.uniqueStoriesCount} unique stories
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{user.totalReads}</div>
                      <div className="text-xs text-muted-foreground">
                        total reads
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>All User Reading Statistics</CardTitle>
            <CardDescription>
              Detailed reading statistics for all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalReads">Most Reads</SelectItem>
                  <SelectItem value="uniqueStories">Most Stories</SelectItem>
                  <SelectItem value="lastRead">Most Recent</SelectItem>
                  <SelectItem value="username">Username</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Loading user statistics...
                </p>
              </div>
            ) : (
              <>
                {/* User Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">User</th>
                        <th className="text-left p-3">Total Reads</th>
                        <th className="text-left p-3">Unique Stories</th>
                        <th className="text-left p-3">First Read</th>
                        <th className="text-left p-3">Last Read</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user._id}
                          className="border-b hover:bg-muted/30"
                        >
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {user._id}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">{user.totalReads}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {user.uniqueStoriesCount}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {formatDate(user.firstRead)}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {formatDate(user.lastRead)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}

                {users.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No reading data found
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "No users match your search criteria"
                        : "No users have read any stories yet"}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
