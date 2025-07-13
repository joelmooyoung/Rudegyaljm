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
import { Avatar, AvatarContent, AvatarFallback } from "@/components/ui/avatar";
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

  // Mock comments data
  useEffect(() => {
    const mockComments: Comment[] = [
      {
        id: "1",
        storyId: story.id,
        userId: "user1",
        username: "BookLover92",
        content:
          "This story was absolutely captivating! The character development was incredible.",
        isEdited: false,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
      },
      {
        id: "2",
        storyId: story.id,
        userId: "user2",
        username: "StoryFan",
        content:
          "I couldn't put it down. The plot twists kept me on the edge of my seat!",
        isEdited: false,
        createdAt: new Date("2024-01-11"),
        updatedAt: new Date("2024-01-11"),
      },
    ];
    setComments(mockComments);
  }, [story.id]);

  const handleLike = async () => {
    setIsLiked(!isLiked);
    // In a real app, this would call the API
    console.log("Like toggled:", !isLiked);
  };

  const handleRating = async (rating: number) => {
    if (isSubmittingRating) return;

    setIsSubmittingRating(true);
    setUserRating(rating);

    try {
      // In a real app, this would call the API
      console.log("Rating submitted:", rating);
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        storyId: story.id,
        userId: user.id,
        username: user.username,
        content: newComment.trim(),
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setComments([comment, ...comments]);
      setNewComment("");

      // In a real app, this would call the API
      console.log("Comment submitted:", comment);
    } catch (error) {
      console.error("Failed to submit comment:", error);
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
            {story.imageUrl && (
              <div className="relative h-64 bg-muted/20">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover"
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
              {!story.imageUrl && (
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
                  <span>{story.viewCount.toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-rating-star fill-current" />
                  <span>
                    {story.rating} ({story.ratingCount} ratings)
                  </span>
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
                            {comment.createdAt instanceof Date
                              ? comment.createdAt.toLocaleDateString()
                              : new Date(
                                  comment.createdAt,
                                ).toLocaleDateString()}
                          </span>
                          {comment.isEdited && (
                            <Badge variant="outline" className="text-xs">
                              edited
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{comment.content}</p>
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
