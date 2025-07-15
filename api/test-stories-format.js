// Quick test to verify stories API format
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Test the stories endpoint format
    const storiesResponse = await fetch(
      `${req.headers.origin || "http://localhost:3000"}/api/stories`,
    );
    const storiesData = await storiesResponse.json();

    const testResult = {
      timestamp: new Date().toISOString(),
      storiesEndpointStatus: storiesResponse.status,
      responseType: Array.isArray(storiesData) ? "Array" : typeof storiesData,
      isArray: Array.isArray(storiesData),
      length: Array.isArray(storiesData) ? storiesData.length : "N/A",
      firstItemKeys:
        Array.isArray(storiesData) && storiesData.length > 0
          ? Object.keys(storiesData[0])
          : "N/A",
      sample:
        Array.isArray(storiesData) && storiesData.length > 0
          ? {
              id: storiesData[0].id,
              title: storiesData[0].title,
              author: storiesData[0].author,
            }
          : "N/A",
    };

    res.json({
      success: true,
      message: "Stories API format test",
      test: testResult,
      expectedFormat: "Array of story objects",
      frontendCompatible: Array.isArray(storiesData),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to test stories API format",
    });
  }
}
