// API Debug Dashboard - Test all endpoints in production
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const baseUrl = `https://${req.headers.host}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Debug Dashboard - Rude Gyal Confessions</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
        }
        h1 { color: #ef4444; }
        .test-section {
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            margin: 20px 0;
            padding: 20px;
        }
        .test-button {
            background: #ef4444;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        .test-button:hover { background: #dc2626; }
        .test-result {
            background: #1a1a1a;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 300px;
            overflow: auto;
        }
        .success { border-color: #10b981; color: #10b981; }
        .error { border-color: #ef4444; color: #ef4444; }
        input, textarea {
            width: 100%;
            padding: 8px;
            margin: 5px 0;
            background: #333;
            border: 1px solid #555;
            color: #fff;
            border-radius: 4px;
        }
        .form-group {
            margin: 15px 0;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #ccc;
        }
    </style>
</head>
<body>
    <h1>🚀 API Debug Dashboard</h1>
    <p>Test all API endpoints for Rude Gyal Confessions</p>

    <!-- API Status Test -->
    <div class="test-section">
        <h2>📡 API Status</h2>
        <button class="test-button" onclick="testApiStatus()">Test API Status</button>
        <div id="api-status-result" class="test-result"></div>
    </div>

    <!-- Stories API Tests -->
    <div class="test-section">
        <h2>📚 Stories API Tests</h2>
        
        <h3>Get All Stories</h3>
        <button class="test-button" onclick="testGetStories()">GET /api/stories</button>
        <div id="get-stories-result" class="test-result"></div>

        <h3>Create New Story</h3>
        <div class="form-group">
            <label>Title:</label>
            <input type="text" id="story-title" value="Test Story" />
            <label>Author:</label>
            <input type="text" id="story-author" value="Test Author" />
            <label>Excerpt:</label>
            <textarea id="story-excerpt" rows="3">This is a test story excerpt...</textarea>
            <label>Content:</label>
            <textarea id="story-content" rows="5">This is the full test story content...</textarea>
            <label>Category:</label>
            <input type="text" id="story-category" value="Romance" />
            <label>Access Level:</label>
            <select id="story-access" style="width: 100%; padding: 8px; background: #333; border: 1px solid #555; color: #fff;">
                <option value="free">Free</option>
                <option value="premium">Premium</option>
            </select>
        </div>
        <button class="test-button" onclick="testCreateStory()">POST /api/stories</button>
        <div id="create-story-result" class="test-result"></div>

        <h3>Update Story</h3>
        <div class="form-group">
            <label>Story ID to Update:</label>
            <input type="text" id="update-story-id" value="1" />
            <label>New Title:</label>
            <input type="text" id="update-story-title" value="Updated Test Story" />
        </div>
        <button class="test-button" onclick="testUpdateStory()">PUT /api/stories/[id]</button>
        <div id="update-story-result" class="test-result"></div>

        <h3>Delete Story</h3>
        <div class="form-group">
            <label>Story ID to Delete:</label>
            <input type="text" id="delete-story-id" value="999" />
        </div>
        <button class="test-button" onclick="testDeleteStory()">DELETE /api/stories/[id]</button>
        <div id="delete-story-result" class="test-result"></div>
    </div>

    <!-- Authentication Tests -->
    <div class="test-section">
        <h2>🔐 Authentication Tests</h2>
        
        <h3>Login Test</h3>
        <div class="form-group">
            <label>Email:</label>
            <input type="email" id="login-email" value="admin@nocturne.com" />
            <label>Password:</label>
            <input type="password" id="login-password" value="test" />
        </div>
        <button class="test-button" onclick="testLogin()">POST /api/auth/login</button>
        <div id="login-result" class="test-result"></div>
    </div>

    <script>
        async function makeRequest(url, options = {}) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                });
                
                const data = await response.json();
                return {
                    status: response.status,
                    ok: response.ok,
                    data: data
                };
            } catch (error) {
                return {
                    status: 0,
                    ok: false,
                    error: error.message
                };
            }
        }

        function displayResult(elementId, result) {
            const element = document.getElementById(elementId);
            const isSuccess = result.ok && result.status < 400;
            
            element.className = isSuccess ? 'test-result success' : 'test-result error';
            element.textContent = JSON.stringify(result, null, 2);
        }

        async function testApiStatus() {
            const result = await makeRequest('/api/test-all');
            displayResult('api-status-result', result);
        }

        async function testGetStories() {
            const result = await makeRequest('/api/stories');
            displayResult('get-stories-result', result);
        }

        async function testCreateStory() {
            const storyData = {
                title: document.getElementById('story-title').value,
                author: document.getElementById('story-author').value,
                excerpt: document.getElementById('story-excerpt').value,
                content: document.getElementById('story-content').value,
                category: document.getElementById('story-category').value,
                accessLevel: document.getElementById('story-access').value,
                tags: ['test', 'debug'],
                isPublished: true
            };

            const result = await makeRequest('/api/stories', {
                method: 'POST',
                body: JSON.stringify(storyData)
            });
            displayResult('create-story-result', result);
        }

        async function testUpdateStory() {
            const storyId = document.getElementById('update-story-id').value;
            const updateData = {
                title: document.getElementById('update-story-title').value,
                excerpt: 'Updated excerpt for testing'
            };

            const result = await makeRequest(\`/api/stories/\${storyId}\`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            displayResult('update-story-result', result);
        }

        async function testDeleteStory() {
            const storyId = document.getElementById('delete-story-id').value;
            const result = await makeRequest(\`/api/stories/\${storyId}\`, {
                method: 'DELETE'
            });
            displayResult('delete-story-result', result);
        }

        async function testLogin() {
            const loginData = {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            };

            const result = await makeRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(loginData)
            });
            displayResult('login-result', result);
        }

        // Auto-test API status on load
        window.addEventListener('load', testApiStatus);
    </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}
