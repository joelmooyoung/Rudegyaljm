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
  ChevronLeft,
  ChevronRight,
  Heart,
  RefreshCw,
  Flame,
  Database,
  BookOpen,
  Mail,
} from "lucide-react";
import { Story, User as UserType } from "@shared/api";
import { makeApiRequest } from "@/utils/api-config";

interface HomeProps {
  user?: UserType;
  onLogout?: () => void;
  onNavigateToAdmin?: (section: string) => void;
  onReadStory?: (story: Story) => void;
  onNavigateToAbout?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToProfile?: (section: string) => void;
  refreshTrigger?: number;
}

export default function Home({
  user,
  onLogout,
  onNavigateToAdmin,
  onReadStory,
  onNavigateToAbout,
  onNavigateToContact,
  onNavigateToHelp,
  onNavigateToProfile,
  refreshTrigger,
}: HomeProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalStories: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    limit: 12
  });

  const categories = [
    "all",
    "premium",
    "free",
    "Romance",
    "Mystery",
    "Comedy",
    "Fantasy",
    "Passionate",
    "Forbidden",
    "Seductive",
  ];

  // Fetch stories from server
  const fetchStories = async (page = currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      // Route to production API when in preview environment
      const isBuilderPreview = window.location.hostname.includes("builder.my");
      const apiUrl = isBuilderPreview
        ? `https://rudegyaljm-amber.vercel.app/api/stories?page=${page}&limit=12`
        : `/api/stories?page=${page}&limit=12`;
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log("Stories API response:", data);

        // Handle different response formats and ensure data is an array
        let storiesArray = [];
        if (Array.isArray(data)) {
          storiesArray = data;
        } else if (data && Array.isArray(data.stories)) {
          storiesArray = data.stories;
        } else if (data && Array.isArray(data.data)) {
          storiesArray = data.data;
        } else {
          console.warn("Stories API returned unexpected format:", data);
          storiesArray = [];
        }

        const storiesWithDates = storiesArray.map((story: any) => ({
          ...story,
          title: story.title || "Untitled",
          author: story.author || "Unknown Author",
          tags: Array.isArray(story.tags) ? story.tags : [],
          createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
          updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date(),
        }));
        setStories(storiesWithDates);

        // Handle pagination data
        if (data && data.pagination) {
          setPagination(data.pagination);
          console.log(`📚 Pagination: Page ${data.pagination.currentPage} of ${data.pagination.totalPages}`);
        } else {
          // Default pagination for legacy format
          setPagination({
            totalPages: 1,
            totalStories: storiesWithDates.length,
            hasNextPage: false,
            hasPreviousPage: false,
            limit: 12
          });
        }
      } else {
        const errorMsg = `Failed to fetch stories: ${response.status} ${response.statusText}`;
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
    fetchStories(currentPage);
  }, [currentPage]);

  // Refresh stories when returning from story reader
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchStories(currentPage);
    }
  }, [refreshTrigger]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedCategory, sortBy]);

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
  };

  // Filter and sort stories
  const filteredStories = stories
    .filter((story) => {
      if (!user) return false;

      // Admin can see all stories including unpublished
      if (user.role === "admin") {
        // Search filter
        const matchesSearch =
          story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          );

        // Category filter (handles both story categories and access levels)
        const matchesCategory =
          selectedCategory === "all" ||
          story.category === selectedCategory ||
          story.accessLevel === selectedCategory;

        return matchesSearch && matchesCategory;
      }

      // Non-admin users only see published stories
      if (!story.isPublished) return false;

      // Free users can only see free stories
      if (user.role === "free" && story.accessLevel === "premium") return false;

      // Search filter
      const matchesSearch =
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      // Category filter (handles both story categories and access levels)
      const matchesCategory =
        selectedCategory === "all" ||
        story.category === selectedCategory ||
        story.accessLevel === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "popular":
          return b.viewCount - a.viewCount;
        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
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
      className="story-card-intimate cursor-pointer group overflow-hidden passionate-shimmer sensual-float"
      onClick={() => handleStoryClick(story)}
    >
      {/* Story Image */}
      {story.image && (
        <div className="relative h-64 bg-muted/20 overflow-hidden rounded-t-lg">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-all duration-700 filter group-hover:brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-red-900/20 group-hover:to-red-900/50 transition-all duration-700" />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Badge
              className={`${
                story.accessLevel === "premium"
                  ? "bg-seductive-gradient text-primary-foreground shadow-lg passionate-glow font-semibold"
                  : "bg-free-badge text-background shadow-md font-semibold"
              }`}
            >
              {story.accessLevel === "premium" && (
                <Crown className="h-3 w-3 mr-1" />
              )}
              {story.accessLevel}
            </Badge>

            {/* Audio indicator */}
            {story.audioUrl && (
              <Badge className="bg-black/60 text-white shadow-lg font-medium backdrop-blur-sm">
                <svg
                  className="h-3 w-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.746 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.746l3.637-3.814a1 1 0 011.617.814zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.896-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.983 3.983 0 0013 10a3.983 3.983 0 00-1.172-2.829 1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Audio
              </Badge>
            )}
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-display font-bold text-xl line-clamp-2 mb-2 drop-shadow-lg group-hover:text-accent transition-colors duration-500">
              {story.title}
            </h3>
            <p className="text-white/95 text-sm font-serif italic drop-shadow">
              by {story.author}
            </p>
          </div>
        </div>
      )}

      {/* Story Header for stories without images */}
      {!story.image && (
        <CardHeader className="pb-4 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-display font-bold leading-tight group-hover:text-passion-gradient transition-colors duration-500">
                {story.title}
              </CardTitle>
              <CardDescription className="font-serif italic text-base mt-1">
                by {story.author}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge
                className={
                  story.accessLevel === "premium"
                    ? "bg-seductive-gradient text-primary-foreground passionate-glow font-semibold"
                    : "bg-free-badge text-background font-semibold"
                }
              >
                {story.accessLevel === "premium" && (
                  <Crown className="h-3 w-3 mr-1" />
                )}
                {story.accessLevel}
              </Badge>

              {/* Audio indicator */}
              {story.audioUrl && (
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary font-medium"
                >
                  <svg
                    className="h-3 w-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.746 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.746l3.637-3.814a1 1 0 011.617.814zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.896-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.983 3.983 0 0013 10a3.983 3.983 0 00-1.172-2.829 1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Audio
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-5 p-6">
        <p className="text-base font-serif text-muted-foreground line-clamp-3 leading-relaxed italic">
          "{story.excerpt}"
        </p>

        <div className="flex flex-wrap gap-2">
          {story.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs bg-category-tag border-border/50 font-serif"
            >
              {tag}
            </Badge>
          ))}
          {story.tags.length > 3 && (
            <Badge variant="outline" className="text-xs font-serif">
              +{story.tags.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-rating-star fill-current" />
              <span className="font-semibold">{story.rating}</span>
              <span className="text-xs">({story.ratingCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{story.viewCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{story.commentCount || 0}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-serif">
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
          <Flame className="h-16 w-16 text-primary mx-auto mb-6 sultry-pulse" />
          <h3 className="text-2xl font-display font-bold text-passion-gradient mb-4">
            Enter the Realm of Desire
          </h3>
          <p className="text-lg font-serif text-muted-foreground">
            You must sign in to unlock these forbidden tales
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ backgroundColor: "#0f172a", color: "white", minHeight: "100vh" }}
    >
      {/* Header */}
      <header
        className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50"
        style={{ backgroundColor: "#1e293b", borderColor: "#374151" }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F9a930541b2654097be9377fff1612aa0%2F6532a2d2c5444a69b0f8c5b4757e7b05?format=webp&width=800"
                alt="Rude Gyal Confessions Logo"
                className="h-12 w-12 object-contain sultry-pulse"
              />
              <h1
                className="text-3xl font-display font-bold text-passion-gradient"
                style={{ color: "#ef4444", fontSize: "1.875rem" }}
              >
                Rude Gyal Confessions
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* User Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                    <span className="font-serif">{user.username}</span>
                    <Badge
                      variant={
                        user.role === "premium" ? "default" : "secondary"
                      }
                      className={
                        user.role === "premium"
                          ? "bg-seductive-gradient text-primary-foreground passionate-glow"
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
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => onNavigateToProfile?.("change-password")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Admin Menu */}
              {user.role === "admin" && onNavigateToAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="seductive-border"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
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
                      User Management
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onNavigateToAdmin("reading-stats")}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Reading Statistics
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onNavigateToAdmin("email-test")}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Test
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        className="container mx-auto px-4 py-8"
        style={{ backgroundColor: "#0f172a" }}
      >
        {/* Hero section */}
        <section className="mb-16 text-center relative overflow-hidden">
          {/* Passionate background gradient */}
          <div className="absolute inset-0 bg-desire-gradient opacity-5 blur-3xl"></div>

          <div className="relative z-10">
            <h2
              className="text-5xl md:text-6xl font-display font-bold text-passion-gradient mb-6 sultry-pulse"
              style={{ color: "#ef4444", fontSize: "3rem" }}
            >
              {user.role === "admin"
                ? "Forbidden Chronicles - Admin Sanctuary"
                : user.role === "premium"
                  ? "Unlock Your Deepest Desires"
                  : "Taste Forbidden Pleasures"}
            </h2>
            <p
              className="text-xl md:text-2xl font-serif text-muted-foreground max-w-4xl mx-auto mb-8 leading-relaxed"
              style={{ color: "#d1d5db", fontSize: "1.25rem" }}
            >
              {user.role === "admin" ? (
                "Command the realm of desire. Curate the most intoxicating tales that ignite souls and awaken hidden passions."
              ) : user.role === "free" ? (
                <>
                  Indulge in tantalizing tales that will leave you breathless.
                  But the most{" "}
                  <em className="text-desire-gradient font-semibold">
                    forbidden secrets
                  </em>{" "}
                  await those who dare to go premium...
                </>
              ) : (
                "Dive deep into an ocean of passion, where every story is a gateway to ecstasy and every word drips with desire."
              )}
            </p>

            {/* Sensual statistics */}
            <div className="flex justify-center gap-8 mb-8 text-sm font-serif">
              <div className="text-center">
                <div className="text-2xl font-bold text-passion-gradient">
                  {pagination.totalStories || stories.length}
                </div>
                <div className="text-muted-foreground">Seductive Tales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-passion-gradient">
                  {stories
                    .reduce((sum, story) => sum + (story.likeCount || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-muted-foreground">Hearts Racing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-passion-gradient">
                  {stories.reduce(
                    (sum, story) => sum + (story.commentCount || 0),
                    0,
                  )}
                </div>
                <div className="text-muted-foreground">Whispered Secrets</div>
              </div>
            </div>
          </div>

          {user.role === "free" && (
            <Card className="max-w-3xl mx-auto story-card-intimate passionate-shimmer seductive-border">
              <CardContent className="p-8">
                <div className="text-center">
                  <Crown className="h-12 w-12 text-accent mx-auto mb-4 sultry-pulse" />
                  <h3 className="text-2xl font-display font-bold text-passion-gradient mb-3">
                    Unlock the Vault of Desires
                  </h3>
                  <p className="text-lg font-serif text-muted-foreground mb-6 leading-relaxed">
                    Behind these golden gates lie the most{" "}
                    <span className="text-desire-gradient font-semibold">
                      intoxicating stories
                    </span>{" "}
                    ever penned. Tales so alluring, so forbidden, they're
                    reserved only for those who dare to indulge completely.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button className="btn-seductive px-8 py-3 text-lg font-semibold">
                      <Heart className="h-5 w-5 mr-2" />
                      Surrender to Premium
                    </Button>
                    <span className="text-sm text-muted-foreground font-serif italic">
                      Your deepest fantasies await...
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Search and filters */}
        <section className="mb-12">
          <div className="max-w-4xl mx-auto">
            <h3
              className="text-2xl font-display font-semibold text-center text-passion-gradient mb-6"
              style={{ color: "#ef4444", fontSize: "1.5rem" }}
            >
              Find Your Perfect Temptation
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for forbidden desires, seductive authors, tantalizing tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 text-lg font-serif bg-input/80 seductive-border focus:passionate-glow transition-all duration-300"
                />
              </div>
              <div className="flex gap-3">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-44 py-3 font-serif seductive-border">
                    <Filter className="h-4 w-4 mr-2 text-accent" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all"
                          ? "All Desires"
                          : category === "premium"
                            ? "💎 Premium Stories"
                            : category === "free"
                              ? "🆓 Free Stories"
                              : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 py-3 font-serif seductive-border">
                    <TrendingUp className="h-4 w-4 mr-2 text-accent" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Latest Desires</SelectItem>
                    <SelectItem value="rating">Most Seductive</SelectItem>
                    <SelectItem value="popular">Most Craved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <Button onClick={fetchStories} className="btn-seductive">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4 sultry-pulse"></div>
              <p className="text-muted-foreground font-serif">
                Loading your temptations...
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredStories.map(renderStoryCard)}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && !error && filteredStories.length > 0 && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 pt-8 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={!pagination.hasPreviousPage}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageSelect(pageNum)}
                    className="w-10 h-10"
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination.hasNextPage}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Show pagination info */}
          {!isLoading && !error && filteredStories.length > 0 && (
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Showing {filteredStories.length} of {pagination.totalStories} stories
              (Page {currentPage} of {pagination.totalPages})
            </div>
          )}

          {!isLoading && !error && filteredStories.length === 0 && (
            <div className="text-center py-12">
              <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 font-display">
                No temptations found
              </h3>
              <p className="text-muted-foreground font-serif">
                Try adjusting your search or explore different desires
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F9a930541b2654097be9377fff1612aa0%2F6532a2d2c5444a69b0f8c5b4757e7b05?format=webp&width=800"
                  alt="Rude Gyal Confessions Logo"
                  className="h-6 w-6 object-contain flex-shrink-0"
                />
                <span className="font-bold text-sm font-display leading-tight">
                  Rude Gyal Confessions
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-serif leading-relaxed">
                Where desires unfold and fantasies come alive through the power
                of passionate storytelling.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold font-display">
                Quick Links
              </h4>
              <div className="space-y-3">
                <button
                  onClick={onNavigateToAbout}
                  className="block text-xs text-muted-foreground hover:text-primary transition-colors font-serif text-left w-full"
                >
                  About Our Passion
                </button>
                <button
                  onClick={onNavigateToContact}
                  className="block text-xs text-muted-foreground hover:text-primary transition-colors font-serif text-left w-full"
                >
                  Contact & Connect
                </button>
                <button
                  onClick={onNavigateToHelp}
                  className="block text-xs text-muted-foreground hover:text-primary transition-colors font-serif text-left w-full"
                >
                  Help & Support
                </button>
              </div>
            </div>

            {/* Social */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold font-display">Follow Us</h4>
              <div className="space-y-3 text-xs text-muted-foreground font-serif">
                <div className="break-all">📸 Instagram: @rudegyaljm</div>
                <div className="break-all">🐦 Twitter: @rudegyaljm</div>
                <div className="break-all">📘 Facebook: @rudegyaljm</div>
                <div className="break-all">📺 YouTube: @rudegyaljm</div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold font-display">Contact</h4>
              <div className="space-y-3 text-xs text-muted-foreground font-serif">
                <div className="break-all">
                  📧 hello@Rudegyalconfessions.com
                </div>
                <div className="break-all">
                  ���️ support@Rudegyalconfessions.com
                </div>
                <div className="break-all">🌐 Rudegyalconfessions.com</div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 mt-8 pt-6 text-center">
            <p className="text-xs text-muted-foreground font-serif">
              © {new Date().getFullYear()} Rudegyalconfessions.com - All rights
              reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
