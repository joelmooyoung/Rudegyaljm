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
  MessageSquare,
} from "lucide-react";
import { Story } from "@shared/api";
import { makeApiRequest } from "@/utils/api-config";

interface StoryMaintenanceProps {
  onBack: () => void;
  onEditStory: (story: Story | null, mode: "add" | "edit") => void;
  onCommentsMaintenance: () => void;
}

export default function StoryMaintenance({
  onBack,
  onEditStory,
  onCommentsMaintenance,
}: StoryMaintenanceProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const categories = ["all", "Romance", "Mystery", "Comedy", "Fantasy"];

  // Fetch stories from server
  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const isBuilderPreview = window.location.hostname.includes("builder.my");
      const apiUrl = isBuilderPreview
        ? "https://rudegyaljm-amber.vercel.app/api/stories"
        : "/api/stories";
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

        // Convert date strings back to Date objects and ensure data integrity
        const storiesWithDates = storiesArray.map((story: any) => ({
          ...story,
          title: story.title || "Untitled",
          author: story.author || "Unknown Author",
          tags: Array.isArray(story.tags) ? story.tags : [],
          createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
          updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date(),
        }));
        setStories(storiesWithDates);
      } else {
        console.error("Failed to fetch stories:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load stories on component mount
  useEffect(() => {
    fetchStories();
  }, []);

  const filteredStories = stories.filter((story) => {
    // Defensive programming - ensure story has required properties
    if (
      !story ||
      !story.title ||
      !story.author ||
      !story.tags ||
      !Array.isArray(story.tags)
    ) {
      return false;
    }

    const matchesSearch =
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.tags.some(
        (tag) => tag && tag.toLowerCase().includes(searchTerm.toLowerCase()),
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

  const handleDeleteStory = async (storyId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this story? This action cannot be undone.",
      )
    ) {
      try {
        const response = await fetch(`/api/stories/${storyId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setStories(stories.filter((story) => story.id !== storyId));
        } else {
          console.error("Failed to delete story:", response.statusText);
        }
      } catch (error) {
        console.error("Error deleting story:", error);
      }
    }
  };

  const togglePublished = async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/publish`, {
        method: "PATCH",
      });
      if (response.ok) {
        const updatedStory = await response.json();
        // Ensure dates are properly converted
        const storyWithDates = {
          ...updatedStory,
          createdAt: new Date(updatedStory.createdAt),
          updatedAt: new Date(updatedStory.updatedAt),
        };
        setStories(
          stories.map((story) =>
            story.id === storyId ? storyWithDates : story,
          ),
        );
      } else {
        console.error("Failed to toggle publish status:", response.statusText);
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCommentsMaintenance}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments
              </Button>
              <Button onClick={() => onEditStory(null, "add")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Story
              </Button>
            </div>
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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading stories...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStories
                .map((story) => {
                  // Safety check to ensure story has all required properties
                  if (!story || !story.id) {
                    return null;
                  }

                  return (
                    <Card
                      key={story.id}
                      className="bg-story-card hover:bg-story-card-hover transition-colors border-border/50 group overflow-hidden"
                    >
                      {/* Story Image */}
                      {story.image && (
                        <div className="relative h-32 bg-muted/20">
                          <img
                            src={story.image}
                            alt={story.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.parentElement!.style.display = "none";
                            }}
                          />
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
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
                              <Badge
                                variant="outline"
                                className="text-xs bg-background/90"
                              >
                                Draft
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

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
                          {!story.image && (
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
                          )}
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
                            <span>
                              {story.createdAt instanceof Date
                                ? story.createdAt.toLocaleDateString()
                                : new Date(
                                    story.createdAt,
                                  ).toLocaleDateString()}
                            </span>
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
                  );
                })
                .filter(Boolean)}
            </div>
          )}

          {!isLoading && filteredStories.length === 0 && (
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
