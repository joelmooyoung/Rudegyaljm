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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Star,
  Eye,
  MessageCircle,
  Crown,
  Search,
  Filter,
  TrendingUp,
  User,
  LogOut,
  Settings,
  Users,
  FileText,
  Activity,
  AlertTriangle,
  ChevronDown,
  Heart,
  RefreshCw,
} from "lucide-react";
import { Story, User as UserType } from "@shared/api";

interface HomeProps {
  user?: UserType;
  onLogout?: () => void;
  onNavigateToAdmin?: (section: string) => void;
  onReadStory?: (story: Story) => void;
}

export default function Home({
  user,
  onLogout,
  onNavigateToAdmin,
  onReadStory,
}: HomeProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ["all", "Romance", "Mystery", "Comedy", "Fantasy"];

  // Fetch stories from server
  const fetchStories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching stories from /api/stories...");
      const response = await fetch("/api/stories");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched stories:", data);
        // Convert date strings back to Date objects
        const storiesWithDates = (data || []).map((story: any) => ({
          ...story,
          title: story.title || "Untitled",
          author: story.author || "Unknown Author",
          tags: Array.isArray(story.tags) ? story.tags : [],
          createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
          updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date(),
        }));
        setStories(storiesWithDates);
        console.log("Processed stories:", storiesWithDates);
      } else {
        const errorMsg = `Failed to fetch stories: ${response.status} ${response.statusText}`;
        console.error(errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      const errorMsg = `Error fetching stories: ${error}`;
      console.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Load stories on component mount
  useEffect(() => {
    fetchStories();
  }, []);

  // Filter stories based on user role
  const getVisibleStories = () => {
    let visibleStories;

    if (user?.role === "admin") {
      // Administrators see ALL stories (including unpublished drafts)
      visibleStories = stories;
    } else if (user?.role === "premium") {
      // Premium users see all published stories (both free and premium)
      visibleStories = stories.filter((story) => story.isPublished);
    } else {
      // Free users only see published free stories
      visibleStories = stories.filter(
        (story) => story.isPublished && story.accessLevel === "free",
      );
    }

    return visibleStories;
  };

  const filteredStories = getVisibleStories()
    .filter((story) => {
      const matchesSearch =
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      const matchesCategory =
        selectedCategory === "all" || story.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // For admin and premium users, sort premium stories first
      if (user?.role !== "free") {
        if (a.accessLevel === "premium" && b.accessLevel === "free") return -1;
        if (a.accessLevel === "free" && b.accessLevel === "premium") return 1;
      }

      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "popular":
          return b.viewCount - a.viewCount;
        case "newest":
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

  const handleStoryClick = (story: Story) => {
    if (onReadStory) {
      onReadStory(story);
    }
  };

  const renderStoryCard = (story: Story) => (
    <Card
      key={story.id}
      className="bg-story-card hover:bg-story-card-hover transition-all duration-200 cursor-pointer border-border/50 group overflow-hidden"
      onClick={() => handleStoryClick(story)}
    >
      {/* Story Image */}
      {story.image && (
        <div className="relative h-48 bg-muted/20 overflow-hidden">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute top-3 right-3">
            <Badge
              variant={
                story.accessLevel === "premium" ? "default" : "secondary"
              }
              className={`${
                story.accessLevel === "premium"
                  ? "bg-premium text-primary-foreground"
                  : "bg-free-badge text-background"
              } shadow-lg`}
            >
              {story.accessLevel === "premium" && (
                <Crown className="h-3 w-3 mr-1" />
              )}
              {story.accessLevel}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-semibold text-lg line-clamp-2 mb-1">
              {story.title}
            </h3>
            <p className="text-white/90 text-sm">by {story.author}</p>
          </div>
        </div>
      )}

      {/* Story Header for stories without images */}
      {!story.image && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                {story.title}
              </CardTitle>
              <CardDescription>by {story.author}</CardDescription>
            </div>
            <Badge
              variant={
                story.accessLevel === "premium" ? "default" : "secondary"
              }
              className={
                story.accessLevel === "premium"
                  ? "bg-premium text-primary-foreground"
                  : "bg-free-badge text-background"
              }
            >
              {story.accessLevel === "premium" && (
                <Crown className="h-3 w-3 mr-1" />
              )}
              {story.accessLevel}
            </Badge>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {story.excerpt}
        </p>

        <div className="flex flex-wrap gap-1">
          {story.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs bg-category-tag border-border/50"
            >
              {tag}
            </Badge>
          ))}
          {story.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{story.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-rating-star fill-current" />
              <span>{story.rating}</span>
              <span className="text-xs">({story.ratingCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{story.viewCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{Math.floor(story.viewCount * 0.1)}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {story.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Please sign in</h3>
          <p className="text-muted-foreground">
            You need to be signed in to view stories
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Nocturne Stories
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.username}</span>
                <Badge
                  variant={user.role === "premium" ? "default" : "secondary"}
                  className={
                    user.role === "premium"
                      ? "bg-premium text-primary-foreground"
                      : user.role === "admin"
                        ? "bg-destructive text-destructive-foreground"
                        : ""
                  }
                >
                  {user.role === "premium" && (
                    <Crown className="h-3 w-3 mr-1" />
                  )}
                  {user.role === "admin" && (
                    <Settings className="h-3 w-3 mr-1" />
                  )}
                  {user.role}
                </Badge>
              </div>

              {/* Admin Menu */}
              {user.role === "admin" && onNavigateToAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => onNavigateToAdmin("stories")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Story Maintenance
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onNavigateToAdmin("users")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      User Maintenance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onNavigateToAdmin("login-logs")}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Login Logs
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onNavigateToAdmin("error-logs")}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Error Logs
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button variant="outline" size="sm" onClick={fetchStories}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>

              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <section className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {user.role === "admin"
              ? "All Stories - Admin View"
              : user.role === "premium"
                ? "Premium & Free Stories"
                : "Free Stories"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {user.role === "admin"
              ? "Manage and view all stories including drafts and published content"
              : user.role === "free"
                ? "Enjoy our collection of free stories. Upgrade to premium for exclusive content!"
                : "Access our complete library of premium and free stories"}
          </p>

          {/* Show story count for debugging */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredStories.length} of {stories.length} stories
            {user.role === "admin" &&
              ` (including ${stories.filter((s) => !s.isPublished).length} drafts)`}
          </p>

          {user.role === "free" && (
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-premium/10 to-accent/10 border-premium/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Crown className="h-8 w-8 text-premium" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">
                      Upgrade to Premium
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Access exclusive stories, unlimited reading, and premium
                      features
                    </p>
                  </div>
                  <Button className="bg-premium hover:bg-premium/90 ml-auto">
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Search and filters */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stories, authors, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input/50"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Stories grid */}
        <section>
          {error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Failed to load stories
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchStories}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading stories...</p>
            </div>
          ) : (
            <>
              {/* Debug info for admins */}
              {user.role === "admin" && stories.length > 0 && (
                <div className="mb-4 p-4 bg-muted/30 rounded-lg text-sm">
                  <strong>Admin Debug Info:</strong>
                  <br />• Total stories in database: {stories.length}
                  <br />• Published:{" "}
                  {stories.filter((s) => s.isPublished).length}
                  <br />• Drafts: {stories.filter((s) => !s.isPublished).length}
                  <br />• Premium:{" "}
                  {stories.filter((s) => s.accessLevel === "premium").length}
                  <br />• Free:{" "}
                  {stories.filter((s) => s.accessLevel === "free").length}
                  <br />• After filtering: {filteredStories.length}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredStories.map(renderStoryCard)}
              </div>
            </>
          )}

          {!isLoading && filteredStories.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No stories found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
