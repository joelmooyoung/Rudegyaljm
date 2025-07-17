import { useState, useEffect } from "react";

const SimpleApp = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = "https://rudegyaljm-amber.vercel.app";

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      console.log("Loading stories...");
      const response = await fetch(`${API_BASE}/api/stories`);
      console.log("Stories response:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Stories data:", data);
        setStories(data.data || data || []);
      } else {
        setError(`Failed to load stories: ${response.status}`);
      }
    } catch (err) {
      console.error("Load error:", err);
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStory = async (storyId, newTitle) => {
    try {
      console.log("Updating story:", storyId, "with title:", newTitle);

      const response = await fetch(`${API_BASE}/api/stories/${storyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      console.log("Update response status:", response.status);

      if (response.ok) {
        alert("Story updated successfully!");
        loadStories(); // Reload
      } else {
        const errorText = await response.text();
        console.log("Update error response:", errorText);
        alert(`Update failed: ${errorText}`);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert(`Update error: ${err}`);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          color: "white",
          padding: "20px",
          background: "#1a1a1a",
          minHeight: "100vh",
        }}
      >
        <h1>🌹 Loading Stories...</h1>
      </div>
    );
  }

  return (
    <div
      style={{
        color: "white",
        padding: "20px",
        background: "#1a1a1a",
        minHeight: "100vh",
      }}
    >
      <h1>🌹 Rude Gyal Confessions - Simple Version</h1>

      {error && (
        <div
          style={{
            color: "red",
            background: "#300",
            padding: "10px",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={loadStories}
          style={{
            background: "#007acc",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
          }}
        >
          Refresh Stories
        </button>
      </div>

      <h2>Stories ({stories.length})</h2>

      {stories.map((story, index) => {
        const storyId =
          story.storyId || story.id || story._id || `story-${index}`;

        return (
          <div
            key={index}
            style={{
              background: "#333",
              padding: "20px",
              margin: "15px 0",
              borderRadius: "8px",
              borderLeft: "4px solid #ff6b9d",
            }}
          >
            <h3>{story.title || "Untitled"}</h3>
            <p>
              <strong>ID:</strong> {storyId}
            </p>
            <p>
              <strong>Author:</strong> {story.author || "Unknown"}
            </p>
            <p>{(story.content || "").substring(0, 200)}...</p>
            <p>
              <small>
                Views: {story.views || 0} | Likes: {story.likeCount || 0}
              </small>
            </p>

            <button
              onClick={() => {
                console.log("Story object:", story);
                const newTitle = prompt("New title:", story.title);
                if (newTitle && newTitle !== story.title) {
                  updateStory(storyId, newTitle);
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
          </div>
        );
      })}

      {stories.length === 0 && !loading && (
        <div style={{ color: "#888", fontStyle: "italic" }}>
          No stories found. Check the API connection.
        </div>
      )}
    </div>
  );
};

export default SimpleApp;
