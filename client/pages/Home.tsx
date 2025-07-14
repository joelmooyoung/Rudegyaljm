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
  Heart,
  RefreshCw,
} from "lucide-react";
import { Story, User as UserType } from "@shared/api";

interface HomeProps {
  user?: UserType;
  onLogout?: () => void;
  onNavigateToAdmin?: (section: string) => void;
  onReadStory?: (story: Story) => void;
  onNavigateToAbout?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToHelp?: () => void;
}

export default function Home({
  user,
  onLogout,
  onNavigateToAdmin,
  onReadStory,
  onNavigateToAbout,
  onNavigateToContact,
  onNavigateToHelp,
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
      className="story-card-intimate cursor-pointer group overflow-hidden passionate-shimmer"
      onClick={() => handleStoryClick(story)}
    >
            {/* Story Image */}
      {story.image && (
        <div className="relative h-52 bg-muted/20 overflow-hidden">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 filter group-hover:brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-red-900/20 group-hover:to-red-900/40 transition-all duration-500" />
          <div className="absolute top-3 right-3">
                        <Badge
              variant={
                story.accessLevel === "premium" ? "default" : "secondary"
              }
              className={`${
                story.accessLevel === "premium"
                  ? "bg-seductive-gradient text-primary-foreground shadow-lg passionate-glow"
                  : "bg-free-badge text-background shadow-md"
              } font-semibold`}
            >
              {story.accessLevel === "premium" && (
                <Crown className="h-3 w-3 mr-1" />
              )}
              {story.accessLevel}
            </Badge>
          </div>
                    <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-display font-bold text-xl line-clamp-2 mb-2 drop-shadow-lg group-hover:text-accent transition-colors duration-300">
              {story.title}
            </h3>
            <p className="text-white/95 text-sm font-serif italic drop-shadow">by {story.author}</p>
          </div>
        </div>
      )}

            {/* Story Header for stories without images */}
      {!story.image && (
        <CardHeader className="pb-4 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-display font-bold leading-tight group-hover:text-passion-gradient transition-colors duration-300">
                {story.title}
              </CardTitle>
              <CardDescription className="font-serif italic text-base mt-1">by {story.author}</CardDescription>
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

            <CardContent className="space-y-5 p-6">
        <p className="text-base font-serif text-muted-foreground line-clamp-3 leading-relaxed italic">
          "{story.excerpt}"
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
              <span>{story.commentCount || 0}</span>
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
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F9a930541b2654097be9377fff1612aa0%2F6532a2d2c5444a69b0f8c5b4757e7b05?format=webp&width=800"
                alt="Rude Gyal Confessions Logo"
                className="h-10 w-10 object-contain"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Rude Gyal Confessions
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
        <section className="mb-16 text-center relative overflow-hidden">
          {/* Passionate background gradient */}
          <div className="absolute inset-0 bg-desire-gradient opacity-5 blur-3xl"></div>

          <div className="relative z-10">
            <h2 className="text-5xl md:text-6xl font-display font-bold text-passion-gradient mb-6 sultry-pulse">
              {user.role === "admin"
                ? "Forbidden Chronicles - Admin Sanctuary"
                : user.role === "premium"
                  ? "Unlock Your Deepest Desires"
                  : "Taste Forbidden Pleasures"}
            </h2>
            <p className="text-xl md:text-2xl font-serif text-muted-foreground max-w-4xl mx-auto mb-8 leading-relaxed">
              {user.role === "admin"
                ? "Command the realm of desire. Curate the most intoxicating tales that ignite souls and awaken hidden passions."
                : user.role === "free"
                  ? "Indulge in tantalizing tales that will leave you breathless. But the most <em className='text-desire-gradient font-semibold'>forbidden secrets</em> await those who dare to go premium..."
                  : "Dive deep into an ocean of passion, where every story is a gateway to ecstasy and every word drips with desire."}
            </p>

            {/* Sensual statistics */}
            <div className="flex justify-center gap-8 mb-8 text-sm font-serif">
              <div className="text-center">
                <div className="text-2xl font-bold text-passion-gradient">{stories.length}</div>
                <div className="text-muted-foreground">Seductive Tales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-passion-gradient">{stories.reduce((sum, story) => sum + story.viewCount, 0).toLocaleString()}</div>
                <div className="text-muted-foreground">Hearts Racing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-passion-gradient">{stories.reduce((sum, story) => sum + (story.commentCount || 0), 0)}</div>
                <div className="text-muted-foreground">Whispered Secrets</div>
              </div>
            </div>
          </div>

          {/* Show story count for debugging */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredStories.length} of {stories.length} stories
            {user.role === "admin" &&
              ` (including ${stories.filter((s) => !s.isPublished).length} drafts)`}
          </p>

                    {user.role === "free" && (
            <Card className="max-w-3xl mx-auto story-card-intimate passionate-shimmer seductive-border">
              <CardContent className="p-8">
                <div className="text-center">
                  <Crown className="h-12 w-12 text-accent mx-auto mb-4 sultry-pulse" />
                  <h3 className="text-2xl font-display font-bold text-passion-gradient mb-3">
                    Unlock the Vault of Desires
                  </h3>
                  <p className="text-lg font-serif text-muted-foreground mb-6 leading-relaxed">
                    Behind these golden gates lie the most <span className="text-desire-gradient font-semibold">intoxicating stories</span> ever penned.
                    Tales so alluring, so forbidden, they're reserved only for those who dare to indulge completely.
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
            <h3 className="text-2xl font-display font-semibold text-center text-passion-gradient mb-6">
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

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-6">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F9a930541b2654097be9377fff1612aa0%2F6532a2d2c5444a69b0f8c5b4757e7b05?format=webp&width=800"
                  alt="Rude Gyal Confessions Logo"
                  className="h-6 w-6 object-contain"
                />
                <span className="font-bold text-sm">Rude Gyal Confessions</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Authentic confessions and intimate stories from real
                experiences.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Quick Links</h4>
              <div className="space-y-2 text-xs">
                {onNavigateToAbout && (
                  <button
                    onClick={onNavigateToAbout}
                    className="block text-muted-foreground hover:text-primary transition-colors"
                  >
                    About Us
                  </button>
                )}
                {onNavigateToContact && (
                  <button
                    onClick={onNavigateToContact}
                    className="block text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact
                  </button>
                )}
                {onNavigateToHelp && (
                  <button
                    onClick={onNavigateToHelp}
                    className="block text-muted-foreground hover:text-primary transition-colors"
                  >
                    Help & FAQ
                  </button>
                )}
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Follow Us</h4>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/rudegyaljm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-pink-500 transition-colors"
                  title="Instagram"
                >
                  📷
                </a>
                <a
                  href="https://twitter.com/rudegyaljm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-blue-400 transition-colors"
                  title="Twitter"
                >
                  🐦
                </a>
                <a
                  href="https://facebook.com/rudegyaljm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-blue-600 transition-colors"
                  title="Facebook"
                >
                  📘
                </a>
                <a
                  href="mailto:hello@rudegyaljm.com"
                  className="text-muted-foreground hover:text-green-500 transition-colors"
                  title="Email"
                >
                  ✉️
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Contact</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>hello@rudegyaljm.com</p>
                <p>support@rudegyaljm.com</p>
                <p>Response: 24 hours</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 mt-6 pt-4 text-center text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Rudegyaljm.com - All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}