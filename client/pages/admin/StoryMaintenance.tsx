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
  Calendar,
  MessageSquare,
  Heart,
  Globe,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Story } from "@shared/api";
import { makeApiRequest } from "@/utils/api-config";

interface StoryMaintenanceProps {
  onBack: () => void;
  onEditStory: (story: Story | null, mode: "add" | "edit") => void;
  onCommentsMaintenance: () => void;
  refreshTrigger?: number;
}

export default function StoryMaintenance({
  onBack,
  onEditStory,
  onCommentsMaintenance,
  refreshTrigger = 0,
}: StoryMaintenanceProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublishingAll, setIsPublishingAll] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStories, setTotalStories] = useState(0);
  const [pageSize] = useState(20);

  const categories = ["all", "Romance", "Mystery", "Comedy", "Fantasy"];

  // Fetch stories from server with real stats
  const fetchStories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const isBuilderPreview = window.location.hostname.includes("builder.my");
      const baseUrl = isBuilderPreview
        ? "https://rudegyaljm-amber.vercel.app/api/stories"
        : "/api/stories";

      // Add admin parameter and pagination to get stories page by page
      const apiUrl = `${baseUrl}?admin=true&page=${currentPage}&limit=${pageSize}`;
      console.log("🔍 [FETCH STORIES] Making request to:", apiUrl);
      console.log("🔍 [FETCH STORIES] Full URL breakdown:", {
        hostname: window.location.hostname,
        isBuilderPreview,
        baseUrl,
        finalUrl: apiUrl,
      });

      const response = await fetch(apiUrl);
      console.log("🔍 [FETCH STORIES] Response details:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Array.from(response.headers.entries()),
      });

      if (response.ok) {
        // Get response as text first to debug parsing issues
        const responseText = await response.text();
        console.log(
          "Stories API raw response (length:",
          responseText.length,
          ")",
        );
        console.log(
          "Stories API raw response preview:",
          responseText.substring(0, 500),
        );

        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Stories API response parsed successfully:", data);
        } catch (parseError) {
          console.error("❌ JSON parsing failed:", parseError);
          console.error("❌ Response text that failed to parse:", responseText);
          setError(
            `Failed to parse stories response: ${parseError instanceof Error ? parseError.message : "JSON parse error"}`,
          );
          return;
        }

        // Handle different response formats and ensure data is an array
        let storiesArray = [];
        let paginationData = null;

        if (Array.isArray(data)) {
          storiesArray = data;
        } else if (data && Array.isArray(data.stories)) {
          storiesArray = data.stories;
          paginationData = data.pagination;
        } else if (data && Array.isArray(data.data)) {
          storiesArray = data.data;
        } else {
          console.warn("Stories API returned unexpected format:", data);
          storiesArray = [];
        }

        // Update pagination state if we have pagination data
        if (paginationData) {
          setTotalStories(paginationData.total);
          setTotalPages(paginationData.totalPages);
          console.log(
            `🔄 Pagination: Page ${paginationData.page} of ${paginationData.totalPages} (${paginationData.total} total stories)`,
          );
        }

        // Convert date strings back to Date objects and fetch real stats in bulk
        const validStories = storiesArray.filter(
          (story) => story && story.id && story.title,
        );

        // Prepare base stories with default values
        const storiesWithDates = validStories.map((story: any) => ({
          ...story,
          title: story.title || "Untitled",
          author: story.author || "Unknown Author",
          tags: Array.isArray(story.tags) ? story.tags : [],
          createdAt: story.createdAt ? new Date(story.createdAt) : new Date(),
          updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date(),
          viewCount: story.viewCount || 0,
          likeCount: story.likeCount || 0,
          rating: story.rating || 0,
          ratingCount: story.ratingCount || 0,
          commentCount: story.commentCount || 0,
        }));

        // Fetch real stats for ALL stories in one API call
        if (validStories.length > 0) {
          try {
            const storyIds = validStories.map((story) => story.id).join(",");
            console.log(
              `📊 Fetching bulk stats for ${validStories.length} stories...`,
            );

            const statsResponse = await fetch(
              `/api/stories-bulk-stats?storyIds=${encodeURIComponent(storyIds)}`,
            );
            if (statsResponse.ok) {
              const bulkStatsData = await statsResponse.json();
              if (bulkStatsData.success) {
                // Update stories with real stats
                storiesWithDates.forEach((story, index) => {
                  const stats = bulkStatsData.stats[story.id];
                  if (stats) {
                    story.viewCount = stats.viewCount || 0;
                    story.likeCount = stats.likeCount || 0;
                    story.rating = stats.rating || 0;
                    story.ratingCount = stats.ratingCount || 0;
                    story.commentCount = stats.commentCount || 0;
                  }
                });
                console.log(
                  `📊 ✅ Updated ${validStories.length} stories with real stats`,
                );
              }
            }
          } catch (statsError) {
            console.warn(`Failed to fetch bulk stats:`, statsError);
          }
        }

        setStories(storiesWithDates);
      } else {
        const errorMsg = `Failed to fetch stories: ${response.status} ${response.statusText}`;
        console.error(errorMsg);
        setError(errorMsg);
        setStories([]);
      }
    } catch (error) {
      const errorMsg = `Error fetching stories: ${error instanceof Error ? error.message : "Unknown error"}`;
      console.error(errorMsg);
      setError(errorMsg);
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load stories on component mount, when page changes, or when refresh is triggered
  useEffect(() => {
    console.log(
      `[STORY MAINTENANCE] 🔄 Fetching stories - page: ${currentPage}, refreshTrigger: ${refreshTrigger}`,
    );
    fetchStories();
  }, [currentPage, refreshTrigger]);

  const filteredStories = stories.filter((story) => {
    // Defensive programming - ensure story has required properties
    if (
      !story ||
      !story.id ||
      !story.title ||
      !story.author ||
      !story.tags ||
      !Array.isArray(story.tags) ||
      !story.category
    ) {
      console.warn("Skipping invalid story:", story);
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

  const publishAllStories = async () => {
    const unpublishedCount = stories.filter(
      (story) => !story.isPublished,
    ).length;

    if (unpublishedCount === 0) {
      alert("All stories are already published!");
      return;
    }

    if (
      confirm(
        `Are you sure you want to publish ALL ${unpublishedCount} unpublished stories? This will make them visible to all users.`,
      )
    ) {
      try {
        setIsPublishingAll(true);
        console.log("🌐 Publishing all stories...");

        const response = await fetch("/api/admin/publish-all-stories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Bulk publish result:", result);

          // Update local state to reflect all stories as published
          setStories((prevStories) =>
            prevStories.map((story) => ({
              ...story,
              isPublished: true,
            })),
          );

          alert(`Successfully published ${result.storiesUpdated} stories!`);
        } else {
          const errorData = await response.json();
          console.error("❌ Failed to publish all stories:", errorData);
          alert(
            `Failed to publish stories: ${errorData.message || response.statusText}`,
          );
        }
      } catch (error) {
        console.error("❌ Error publishing all stories:", error);
        alert(
          `Error publishing stories: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsPublishingAll(false);
      }
    }
  };

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
              <Button
                variant="outline"
                onClick={publishAllStories}
                disabled={isPublishingAll}
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                {isPublishingAll ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-green-600 border-t-transparent rounded-full"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Publish All
                  </>
                )}
              </Button>
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
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-destructive font-medium">
                Failed to load initial data: {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStories}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading stories...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStories
                .filter((story) => story && story.id && story.title)
                .map((story) => {
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
                          {Array.isArray(story.tags) &&
                            story.tags.slice(0, 3).map(
                              (tag, index) =>
                                tag && (
                                  <Badge
                                    key={`${story.id}-tag-${index}`}
                                    variant="outline"
                                    className="text-xs bg-category-tag border-border/50"
                                  >
                                    {tag}
                                  </Badge>
                                ),
                            )}
                          {Array.isArray(story.tags) &&
                            story.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{story.tags.length - 3}
                              </Badge>
                            )}
                        </div>

                        <div className="space-y-2">
                          {/* Stats Row 1 */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3 text-blue-500" />
                                <span>{story.viewCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span>{story.likeCount || 0}</span>
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

                          {/* Stats Row 2 */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{story.commentCount || 0} comments</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>{story.rating || 0}★</span>
                              <span className="text-gray-400">
                                ({story.ratingCount || 0})
                              </span>
                            </div>
                            {story.isPublished && (
                              <div className="text-green-600 font-medium">
                                Published
                              </div>
                            )}
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

          {/* Pagination Controls */}
          {!isLoading && filteredStories.length > 0 && totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
                      }
                      className={
                        currentPage <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages &&
                        setCurrentPage(currentPage + 1)
                      }
                      className={
                        currentPage >= totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Pagination Info */}
          {!isLoading && totalStories > 0 && (
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Showing {Math.min(pageSize, filteredStories.length)} of{" "}
              {filteredStories.length} filtered stories
              {totalStories !== filteredStories.length &&
                ` (${totalStories} total)`}
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
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
