import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Comment {
  commentId: string;
  storyId: string;
  userId: string;
  username: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

const WorkingCommentsMaintenance = ({ onBack }: { onBack: () => void }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("Loading all comments...");
      const response = await fetch(
        "https://rudegyaljm-amber.vercel.app/api/comments",
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Comments loaded:", data);

      const commentsData = data.data || data || [];
      setComments(commentsData);
    } catch (err) {
      console.error("Failed to load comments:", err);
      setError(`Failed to load comments: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(
        `https://rudegyaljm-amber.vercel.app/api/comments/${commentId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setComments(comments.filter((c) => c.commentId !== commentId));
        setError("Comment deleted successfully");
      } else {
        throw new Error(`Failed to delete: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
      setError(`Failed to delete comment: ${err}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline">
              ← Back
            </Button>
            <h1 className="text-3xl font-bold">Comments Management</h1>
          </div>
          <div className="text-center">Loading comments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold">Comments Management</h1>
          <Button onClick={loadComments} variant="outline">
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Comments ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {comments.length === 0 ? (
              <p className="text-muted-foreground">No comments found.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.commentId}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-primary">
                          {comment.username}
                        </strong>
                        <span className="text-muted-foreground ml-2">
                          on Story {comment.storyId}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-foreground">{comment.comment}</p>
                    <div className="text-xs text-muted-foreground">
                      ID: {comment.commentId} | User: {comment.userId}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkingCommentsMaintenance;
