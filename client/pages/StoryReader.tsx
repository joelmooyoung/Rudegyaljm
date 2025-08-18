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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Heart,
  Star,
  MessageCircle,
  Crown,
  Eye,
  Calendar,
  User,
  Send,
} from "lucide-react";
import { Story, User as UserType, Comment } from "@shared/api";

interface StoryReaderProps {
  story: Story;
  user: UserType;
  onBack: () => void;
}

export default function StoryReader({ story, user, onBack }: StoryReaderProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [storyStats, setStoryStats] = useState({
    rating: story.rating,
    ratingCount: story.ratingCount,
    viewCount: story.viewCount,
    commentCount: story.commentCount || 0,
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Increment view count
        const viewResponse = await fetch(`/api/stories/${story.id}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        // Update local view count
        if (viewResponse.ok) {
          const viewResult = await viewResponse.json();
          setStoryStats((prev) => ({
            ...prev,
            viewCount: viewResult.data?.viewCount || prev.viewCount + 1,
          }));
        } else {
          // Fallback to local increment if API fails
          setStoryStats((prev) => ({
            ...prev,
            viewCount: prev.viewCount + 1,
          }));
        }

        // Record user story read for logged-in users
        if (user && user.id) {
          try {
            const readResponse = await fetch("/api/user-story-reads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                username: user.username || user.email,
                storyId: story.id,
                storyTitle: story.title,
              }),
            });

            if (readResponse.ok) {
              const readResult = await readResponse.json();
              console.log(
                `📚 Story read recorded: User ${user.username} has read ${readResult.data.totalReads} stories total`,
              );
            }
          } catch (error) {
            console.error("Failed to record story read:", error);
            // Don't break the user experience if read tracking fails
          }
        }

        // Load comments using working API
        console.log("Loading comments for story:", story.id);
        const commentsResponse = await fetch(
          `https://rudegyaljm-amber.vercel.app/api/comments?storyId=${story.id}`,
        );
        if (commentsResponse.ok) {
          const commentsResponseData = await commentsResponse.json();
          const commentsData =
            commentsResponseData.data || commentsResponseData || [];
          console.log("Loaded comments for story:", commentsData);
          setComments(
            commentsData.map((comment: any) => ({
              ...comment,
              createdAt: new Date(comment.createdAt),
              updatedAt: new Date(comment.updatedAt),
            })),
          );
        }

        // Load user interaction (rating and like status)
        const interactionResponse = await fetch(
          `/api/stories/${story.id}/user-interaction?userId=${user.id}`,
        );
        if (interactionResponse.ok) {
          const interactionData = await interactionResponse.json();
          setUserRating(interactionData.rating || 0);
          setIsLiked(interactionData.liked || false);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };

    loadInitialData();
  }, [story.id, user.id]);

  // Function to refresh story stats
  const refreshStoryStats = async () => {
    try {
      const statsResponse = await fetch(`/api/stories/${story.id}/stats`);
      if (statsResponse.ok) {
        const response = await statsResponse.json();
        const stats = response.data || response;
        setStoryStats((prev) => ({
          rating: stats.averageRating || prev.rating,
          ratingCount: stats.ratingCount || prev.ratingCount,
          viewCount: stats.viewCount || prev.viewCount,
          commentCount: stats.commentCount || prev.commentCount,
          likeCount: stats.likeCount || prev.likeCount,
        }));
      }
    } catch (error) {
      console.error("Failed to refresh story stats:", error);
    }
  };

  const handleLike = async () => {
    try {
      const action = isLiked ? 'unlike' : 'like';
      const response = await fetch(`/api/stories/${story.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          action: action
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setIsLiked(result.action === 'like');

        // Update local stats immediately
        setStoryStats((prev) => ({
          ...prev,
          likeCount: result.newLikeCount || prev.likeCount,
        }));

        // Also refresh story stats to sync with server
        await refreshStoryStats();
      } else {
        console.error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleRating = async (rating: number) => {
    if (isSubmittingRating) return;

    setIsSubmittingRating(true);

    try {
      const response = await fetch(`/api/stories/${story.id}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating,
          userId: user.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setUserRating(rating);

        // Update local stats immediately with API response data
        setStoryStats((prev) => ({
          ...prev,
          rating: result.newAverageRating || prev.rating,
          ratingCount: result.newRatingCount || prev.ratingCount,
        }));

        // Also refresh story stats to sync with server
        await refreshStoryStats();
      } else {
        console.error("Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);

    try {
      // Use working comments API for both saving and loading
      const response = await fetch(
        "https://rudegyaljm-amber.vercel.app/api/comments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storyId: story.id,
            content: newComment.trim(),
            userId: user.id,
            username: user.username,
          }),
        },
      );

      if (response.ok) {
        const responseData = await response.json();
        const newCommentData = responseData.data || responseData;

        const comment: Comment = {
          id: newCommentData.commentId,
          userId: newCommentData.userId,
          username: newCommentData.username,
          comment: newCommentData.comment,
          content: newCommentData.comment, // For compatibility
          storyId: newCommentData.storyId,
          createdAt: new Date(newCommentData.createdAt),
          updatedAt: new Date(newCommentData.createdAt),
        };
        setComments([comment, ...comments]);
        setNewComment("");

        // Update local comment count immediately
        setStoryStats((prev) => ({
          ...prev,
          commentCount: prev.commentCount + 1,
        }));

        // Also refresh story stats to sync with server
        await refreshStoryStats();
      } else {
        console.error("Failed to submit comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const renderStars = (interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            } transition-transform`}
            onClick={() => interactive && handleRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            disabled={!interactive || isSubmittingRating}
          >
            <Star
              className={`h-5 w-5 ${
                star <= (hoverRating || userRating)
                  ? "text-rating-star fill-current"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
        {interactive && (
          <span className="ml-2 text-sm text-muted-foreground">
            {userRating > 0 ? `You rated: ${userRating}/5` : "Rate this story"}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stories
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground truncate">
                {story.title}
              </h1>
              <p className="text-sm text-muted-foreground">by {story.author}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8">
          {/* Story Header */}
          <Card className="overflow-hidden">
            {/* Story Image */}
            {story.image && (
              <div className="relative h-80 bg-muted/20">
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {story.title}
                  </h2>
                  <p className="text-white/90 text-lg">by {story.author}</p>
                </div>
                <div className="absolute top-4 right-4">
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
                      <Crown className="h-4 w-4 mr-1" />
                    )}
                    {story.accessLevel}
                  </Badge>
                </div>
              </div>
            )}

            <CardHeader>
              {!story.image && (
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">
                      {story.title}
                    </CardTitle>
                    <CardDescription className="text-lg">
                      by {story.author}
                    </CardDescription>
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
                      <Crown className="h-4 w-4 mr-1" />
                    )}
                    {story.accessLevel}
                  </Badge>
                </div>
              )}

              <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {story.createdAt instanceof Date
                      ? story.createdAt.toLocaleDateString()
                      : new Date(story.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{storyStats.viewCount.toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-rating-star fill-current" />
                  <span>
                    {storyStats.rating} ({storyStats.ratingCount} ratings)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{storyStats.commentCount} comments</span>
                </div>
                <Badge variant="outline">{story.category}</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {story.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs bg-category-tag"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {story.excerpt && (
                <p className="text-muted-foreground italic">{story.excerpt}</p>
              )}

              {/* Audio Player */}
              {story.audioUrl && (
                <div className="mt-6 p-4 bg-muted/20 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <svg
                        className="h-5 w-5 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.814L4.746 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.746l3.637-3.814a1 1 0 011.617.814zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.896-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.983 3.983 0 0013 10a3.983 3.983 0 00-1.172-2.829 1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>🎧 Listen to Audio Version</span>
                    </div>
                  </div>
                  <audio
                    controls
                    className="w-full"
                    preload="metadata"
                    controlsList="nodownload"
                  >
                    <source src={story.audioUrl} type="audio/mpeg" />
                    <source src={story.audioUrl} type="audio/wav" />
                    <source src={story.audioUrl} type="audio/ogg" />
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-xs text-muted-foreground mt-2">
                    🎙️ Narrated version available - Listen while you read or
                    enjoy hands-free
                  </p>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Story Content */}
          <Card>
            <CardHeader>
              <CardTitle>Story</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: story.content }}
              />
            </CardContent>
          </Card>

          {/* Interaction Section */}
          <Card>
            <CardHeader>
              <CardTitle>What did you think?</CardTitle>
              <CardDescription>
                Share your thoughts and rate this story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Like and Rating */}
              <div className="flex items-center gap-6">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  onClick={handleLike}
                  className={isLiked ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`}
                  />
                  {isLiked ? "Liked" : "Like"}
                </Button>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Rate this story:</span>
                  {renderStars(true)}
                </div>
              </div>

              {/* Comment Form */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Add a comment:</label>
                <Textarea
                  placeholder="Share your thoughts about this story..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-3 p-4 bg-muted/30 rounded-lg"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.createdAt &&
                            !isNaN(new Date(comment.createdAt).getTime())
                              ? new Date(comment.createdAt).toLocaleDateString()
                              : "Recent"}
                          </span>
                          {comment.isEdited && (
                            <Badge variant="outline" className="text-xs">
                              edited
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">
                          {comment.comment ||
                            comment.content ||
                            "No comment text"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
