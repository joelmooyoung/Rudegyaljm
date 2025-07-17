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
  MessageSquare,
  Trash2,
  Search,
  ArrowLeft,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { Comment, Story } from "@shared/api";

interface CommentsMaintenanceProps {
  onBack: () => void;
}

interface CommentWithStory extends Comment {
  storyTitle?: string;
}

export default function CommentsMaintenance({
  onBack,
}: CommentsMaintenanceProps) {
  const [comments, setComments] = useState<CommentWithStory[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [storyFilter, setStoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stories and comments from server
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch stories first
      const storiesResponse = await fetch("/api/stories");
      let storiesData: Story[] = [];
      if (storiesResponse.ok) {
        storiesData = await storiesResponse.json();
        setStories(storiesData);
      }

      // Fetch comments for each story and combine them
      const allComments: CommentWithStory[] = [];
      for (const story of storiesData) {
        try {
          const commentsResponse = await fetch(
            `/api/stories/${story.id}/comments`,
          );
          if (commentsResponse.ok) {
            const storyComments: Comment[] = await commentsResponse.json();
            const commentsWithStoryTitle = storyComments.map((comment) => ({
              ...comment,
              storyTitle: story.title,
              createdAt: new Date(comment.createdAt),
              updatedAt: new Date(comment.updatedAt),
            }));
            allComments.push(...commentsWithStoryTitle);
          }
        } catch (error) {
          console.error(
            `Error fetching comments for story ${story.id}:`,
            error,
          );
        }
      }

      // Sort comments by creation date (newest first)
      allComments.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setComments(allComments);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comment.storyTitle &&
        comment.storyTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStory =
      storyFilter === "all" || comment.storyId === storyFilter;

    return matchesSearch && matchesStory;
  });

  const handleDeleteComment = async (commentId: string, storyId: string) => {
    try {
      // Note: We need to create this endpoint in the backend
      const response = await fetch(
        `/api/stories/${storyId}/comments/${commentId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setComments(comments.filter((comment) => comment.id !== commentId));
      } else {
        console.error("Failed to delete comment:", response.statusText);
        alert("Failed to delete comment. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Error deleting comment. Please try again.");
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
              <MessageSquare className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Comments Maintenance
              </h1>
              <Badge variant="secondary" className="ml-2">
                {filteredComments.length} comments
              </Badge>
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
              placeholder="Search comments, users, or stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={storyFilter} onValueChange={setStoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stories</SelectItem>
                {stories.map((story) => (
                  <SelectItem key={story.id} value={story.id}>
                    {story.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comments List */}
        <div className="max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading comments...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <Card
                  key={comment.id}
                  className="bg-card hover:bg-card/80 transition-colors border-border/50"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-base">
                            {comment.username}
                          </CardTitle>
                          {comment.isEdited && (
                            <Badge variant="outline" className="text-xs">
                              Edited
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>Story: {comment.storyTitle || "Unknown"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Comment
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this comment by{" "}
                                <strong>{comment.username}</strong>? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteComment(
                                    comment.id,
                                    comment.storyId,
                                  )
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-foreground leading-relaxed">
                      {truncateText(comment.content)}
                    </p>
                    {comment.content.length > 150 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Full comment contains {comment.content.length}{" "}
                        characters
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && filteredComments.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No comments found</h3>
              <p className="text-muted-foreground">
                {searchTerm || storyFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No comments have been posted yet"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
