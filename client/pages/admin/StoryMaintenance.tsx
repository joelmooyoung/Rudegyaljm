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
  FileText,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Crown,
  ArrowLeft,
  Star,
  Calendar,
} from "lucide-react";
import { Story } from "@shared/api";

// Mock story data for demonstration
const mockStories: Story[] = [
  {
    id: "1",
    title: "Midnight Desires",
    excerpt:
      "A passionate tale of forbidden romance that unfolds under the cover of darkness...",
    content:
      "<p>In the depths of the city night, <strong>Emma</strong> discovered that some secrets are worth keeping...</p>",
    author: "Elena Rossini",
    category: "Romance",
    tags: ["passion", "forbidden", "dark"],
    accessLevel: "free",
    isPublished: true,
    rating: 4.8,
    ratingCount: 234,
    viewCount: 1542,
    imageUrl:
      "https://images.unsplash.com/photo-1518136247453-74e7b5265980?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "The Executive's Secret",
    excerpt:
      "Power, money, and desire collide in this steamy corporate thriller...",
    content:
      "<p>Marcus Steel ruled the boardroom by day, but at night, his desires led him down a different path...</p>",
    author: "Marcus Steel",
    category: "Mystery",
    tags: ["corporate", "power", "secrets"],
    accessLevel: "premium",
    isPublished: true,
    rating: 4.9,
    ratingCount: 156,
    viewCount: 892,
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    title: "Summer Heat",
    excerpt:
      "A vacation romance that turns into something much more intense...",
    content:
      "<p>What started as a simple beach vacation became the adventure of a lifetime...</p>",
    author: "Sofia Martinez",
    category: "Romance",
    tags: ["vacation", "summer", "romance"],
    accessLevel: "free",
    isPublished: true,
    rating: 4.6,
    ratingCount: 89,
    viewCount: 456,
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
  },
  {
    id: "4",
    title: "Dragons of Eldoria",
    excerpt:
      "In a world where dragons rule the skies, one woman must choose between love and duty...",
    content:
      "<p>The ancient prophecy spoke of a chosen one who would bridge two worlds...</p>",
    author: "J.R. Windham",
    category: "Fantasy",
    tags: ["dragons", "magic", "prophecy"],
    accessLevel: "premium",
    isPublished: false,
    rating: 4.2,
    ratingCount: 67,
    viewCount: 234,
    imageUrl:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-06"),
  },
  {
    id: "5",
    title: "The Comedy Club Catastrophe",
    excerpt:
      "When the lights go out at the comedy club, the real show begins...",
    content:
      "<p>Nobody expected the evening to end with a mystery that would change everything...</p>",
    author: "Danny Laughs",
    category: "Comedy",
    tags: ["humor", "mystery", "club"],
    accessLevel: "free",
    isPublished: true,
    rating: 4.4,
    ratingCount: 123,
    viewCount: 789,
    imageUrl:
      "https://images.unsplash.com/photo-1524863479829-916d8e77f114?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03"),
  },
  {
    id: "6",
    title: "Whispers in the Library",
    excerpt: "Some books contain more than just words...",
    content:
      "<p>The old library held secrets that had been buried for decades...</p>",
    author: "Margaret Ashworth",
    category: "Mystery",
    tags: ["library", "secrets", "supernatural"],
    accessLevel: "premium",
    isPublished: true,
    rating: 4.7,
    ratingCount: 198,
    viewCount: 1123,
    imageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
  },
];

interface StoryMaintenanceProps {
  onBack: () => void;
  onEditStory: (story: Story | null, mode: "add" | "edit") => void;
}

export default function StoryMaintenance({
  onBack,
  onEditStory,
}: StoryMaintenanceProps) {
  const [stories, setStories] = useState<Story[]>(mockStories);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categories = ["all", "Romance", "Mystery", "Comedy", "Fantasy"];

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesCategory =
      categoryFilter === "all" || story.category === categoryFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && story.isPublished) ||
      (statusFilter === "draft" && !story.isPublished) ||
      (statusFilter === "premium" && story.accessLevel === "premium") ||
      (statusFilter === "free" && story.accessLevel === "free");

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDeleteStory = (storyId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this story? This action cannot be undone.",
      )
    ) {
      setStories(stories.filter((story) => story.id !== storyId));
    }
  };

  const togglePublished = (storyId: string) => {
    setStories(
      stories.map((story) =>
        story.id === storyId
          ? { ...story, isPublished: !story.isPublished, updatedAt: new Date() }
          : story,
      ),
    );
  };

  const stripHTML = (html: string): string => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
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
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Story Maintenance
              </h1>
              <Badge variant="secondary" className="ml-2">
                {filteredStories.length} stories
              </Badge>
            </div>
            <Button onClick={() => onEditStory(null, "add")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Story
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories, authors, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStories.map((story) => (
              <Card
                key={story.id}
                className="bg-story-card hover:bg-story-card-hover transition-colors border-border/50 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight truncate group-hover:text-primary transition-colors">
                        {story.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        by {story.author}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={
                          story.accessLevel === "premium"
                            ? "default"
                            : "secondary"
                        }
                        className={`text-xs ${
                          story.accessLevel === "premium"
                            ? "bg-premium text-primary-foreground"
                            : "bg-free-badge text-background"
                        }`}
                      >
                        {story.accessLevel === "premium" && (
                          <Crown className="h-3 w-3 mr-1" />
                        )}
                        {story.accessLevel}
                      </Badge>
                      {!story.isPublished && (
                        <Badge variant="outline" className="text-xs">
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

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

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-rating-star fill-current" />
                        <span>{story.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{story.viewCount}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{story.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs w-fit">
                    {story.category}
                  </Badge>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditStory(story, "edit")}
                      className="flex-1"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePublished(story.id)}
                    >
                      {story.isPublished ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteStory(story.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStories.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stories found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ||
                categoryFilter !== "all" ||
                statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No stories have been created yet"}
              </p>
              <Button onClick={() => onEditStory(null, "add")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Story
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
