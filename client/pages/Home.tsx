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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Story, User as UserType } from "@shared/api";

// Mock data for now
const mockStories: Story[] = [
  {
    id: "1",
    title: "Midnight Desires",
    excerpt:
      "A passionate tale of forbidden romance that unfolds under the cover of darkness...",
    content: "",
    author: "Elena Rossini",
    category: "Romance",
    tags: ["passion", "forbidden", "dark"],
    accessLevel: "free",
    isPublished: true,
    rating: 4.8,
    ratingCount: 234,
    viewCount: 1542,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "The Executive's Secret",
    excerpt:
      "Power, money, and desire collide in this steamy corporate thriller...",
    content: "",
    author: "Marcus Steel",
    category: "Thriller",
    tags: ["corporate", "power", "secrets"],
    accessLevel: "premium",
    isPublished: true,
    rating: 4.9,
    ratingCount: 156,
    viewCount: 892,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    title: "Summer Heat",
    excerpt:
      "A vacation romance that turns into something much more intense...",
    content: "",
    author: "Sofia Martinez",
    category: "Contemporary",
    tags: ["vacation", "summer", "romance"],
    accessLevel: "free",
    isPublished: true,
    rating: 4.6,
    ratingCount: 89,
    viewCount: 456,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
  },
];

const mockUser: UserType = {
  id: "1",
  email: "user@example.com",
  username: "reader123",
  role: "free",
  isAgeVerified: true,
  subscriptionStatus: "none",
  createdAt: new Date(),
};

interface HomeProps {
  user?: UserType;
  onLogout?: () => void;
  onNavigateToAdmin?: (section: string) => void;
}

export default function Home({
  user = mockUser,
  onLogout,
  onNavigateToAdmin,
}: HomeProps) {
  const [stories, setStories] = useState<Story[]>(mockStories);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const categories = ["all", "Romance", "Thriller", "Contemporary", "Fantasy"];

  const filteredStories = stories
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

  const renderStoryCard = (story: Story) => (
    <Card
      key={story.id}
      className="bg-story-card hover:bg-story-card-hover transition-colors cursor-pointer border-border/50 group"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
              {story.title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              by {story.author}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                story.accessLevel === "premium" ? "default" : "secondary"
              }
              className={`${
                story.accessLevel === "premium"
                  ? "bg-premium text-primary-foreground"
                  : "bg-free-badge text-background"
              }`}
            >
              {story.accessLevel === "premium" ? (
                <Crown className="h-3 w-3 mr-1" />
              ) : null}
              {story.accessLevel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {story.excerpt}
        </p>

        <div className="flex flex-wrap gap-1">
          {story.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs bg-category-tag border-border/50"
            >
              {tag}
            </Badge>
          ))}
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
            Discover Your Next Favorite Story
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Immerse yourself in premium adult fiction crafted by talented
            writers from around the world
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredStories.map(renderStoryCard)}
          </div>

          {filteredStories.length === 0 && (
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
