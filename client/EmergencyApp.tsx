import { useState, useEffect } from "react";

const EmergencyApp = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = "https://rudegyaljm-amber.vercel.app";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load stories
      const storiesResponse = await fetch(`${API_BASE}/api/stories`);
      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json();
        setStories(storiesData.data || storiesData || []);
      }

      // Load comments
      const commentsResponse = await fetch(`${API_BASE}/api/debug-comments`);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setComments(commentsData.dateAnalysis || []);
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load data");
      setLoading(false);
    }
  };

  const addComment = async (storyId: string, content: string) => {
    console.log("Adding comment:", { storyId, content });

    if (!storyId || storyId === "undefined") {
      alert("Error: Story ID is missing");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/stories/${storyId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            userId: "admin1",
            username: "admin",
          }),
        },
      );

      const result = await response.json();
      console.log("Comment response:", result);

      if (response.ok) {
        alert("Comment added successfully!");
        loadData(); // Reload data
      } else {
        alert(
          `Failed to add comment: ${result.message || response.statusText}`,
        );
      }
    } catch (err) {
      console.error("Comment error:", err);
      alert(`Error adding comment: ${err}`);
    }
  };

  const updateStory = async (storyId: string, updates: any) => {
    console.log("Updating story:", { storyId, updates });

    if (!storyId || storyId === "undefined") {
      alert("Error: Story ID is missing");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/stories/${storyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      console.log("Update response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Update response:", result);
        alert("Story updated successfully!");
        loadData(); // Reload data
      } else {
        const errorText = await response.text();
        console.log("Update error:", errorText);
        alert(`Failed to update story (${response.status}): ${errorText}`);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert(`Error updating story: ${err}`);
    }
  };

  if (loading)
    return <div style={{ color: "white", padding: "20px" }}>Loading...</div>;

  return (
    <div
      style={{
        background: "#1a1a1a",
        color: "white",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <h1>🌹 Rude Gyal Confessions - Working Version</h1>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <div style={{ marginBottom: "30px" }}>
        <h2>Stories ({stories.length})</h2>
        {stories.map((story, index) => (
          <div
            key={story.storyId || index}
            style={{
              background: "#333",
              padding: "15px",
              margin: "10px 0",
              borderRadius: "8px",
            }}
          >
            <h3>{story.title}</h3>
            <p>
              <strong>Author:</strong> {story.author}
            </p>
            <p>{story.content?.substring(0, 150)}...</p>
            <p>
              <small>
                Views: {story.views} | Likes: {story.likeCount}
              </small>
            </p>

            <button
              onClick={() => {
                console.log("Story object:", story);
                const storyId = story.storyId || story.id || story._id;
                console.log("Using story ID:", storyId);

                if (!storyId) {
                  alert("Error: No story ID found");
                  return;
                }

                const newTitle = prompt("New title:", story.title);
                if (newTitle) {
                  updateStory(storyId, { title: newTitle });
                }
              }}
              style={{
                background: "#ff6b9d",
                color: "white",
                border: "none",
                padding: "8px 15px",
                borderRadius: "4px",
                margin: "5px",
              }}
            >
              Edit Title
            </button>

            <button
              onClick={() => {
                const storyId = story.storyId || story.id || story._id;
                console.log("Adding comment to story:", storyId);

                if (!storyId) {
                  alert("Error: No story ID found");
                  return;
                }

                const comment = prompt("Add comment:");
                if (comment) {
                  addComment(storyId, comment);
                }
              }}
              style={{
                background: "#4caf50",
                color: "white",
                border: "none",
                padding: "8px 15px",
                borderRadius: "4px",
                margin: "5px",
              }}
            >
              Add Comment
            </button>
          </div>
        ))}
      </div>

      <div>
        <h2>Comments ({comments.length})</h2>
        {comments.map((comment, index) => (
          <div
            key={comment.commentId || index}
            style={{
              background: "#2a2a2a",
              padding: "10px",
              margin: "5px 0",
              borderRadius: "4px",
            }}
          >
            <p>
              <strong>Comment ID:</strong> {comment.commentId}
            </p>
            <p>
              <strong>Created:</strong> {comment.createdAtString}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={loadData}
        style={{
          background: "#007acc",
          color: "white",
          border: "none",
          padding: "12px 20px",
          borderRadius: "4px",
          marginTop: "20px",
        }}
      >
        Refresh Data
      </button>
    </div>
  );
};

export default EmergencyApp;
