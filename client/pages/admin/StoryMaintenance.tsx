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
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [connectionDebug, setConnectionDebug] = useState<any>(null);

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

        // Capture debug information
        const debugData = {
          apiUrl,
          responseStatus: response.status,
          responseOk: response.ok,
          rawDataType: Array.isArray(data) ? "array" : typeof data,
          rawDataLength: Array.isArray(data)
            ? data.length
            : data?.stories?.length || data?.data?.length || "unknown",
          responseKeys: typeof data === "object" ? Object.keys(data || {}) : [],
          timestamp: new Date().toISOString(),
        };

        // Handle different response formats and ensure data is an array
        let storiesArray = [];
        let paginationData = null;

        if (Array.isArray(data)) {
          storiesArray = data;
          debugData.sourceFormat = "direct array";
        } else if (data && Array.isArray(data.stories)) {
          storiesArray = data.stories;
          paginationData = data.pagination;
          debugData.sourceFormat = "data.stories array with pagination";
        } else if (data && Array.isArray(data.data)) {
          storiesArray = data.data;
          debugData.sourceFormat = "data.data array";
        } else {
          console.warn("Stories API returned unexpected format:", data);
          storiesArray = [];
          debugData.sourceFormat = "unknown/fallback";
          debugData.warning = "Unexpected API response format";
        }

        debugData.extractedCount = storiesArray.length;

        // Update pagination state if we have pagination data
        if (paginationData) {
          setTotalStories(paginationData.total);
          setTotalPages(paginationData.totalPages);
          console.log(
            `📄 Pagination: Page ${paginationData.page} of ${paginationData.totalPages} (${paginationData.total} total stories)`,
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

        // Complete debug information
        debugData.validStoriesCount = validStories.length;
        debugData.finalStoriesCount = storiesWithDates.length;
        debugData.publishedCount = storiesWithDates.filter(
          (s) => s.isPublished,
        ).length;
        debugData.unpublishedCount = storiesWithDates.filter(
          (s) => !s.isPublished,
        ).length;
        debugData.storySample = storiesWithDates.slice(0, 5).map((s) => ({
          id: s.id,
          title: s.title,
          isPublished: s.isPublished,
          author: s.author,
        }));

        setDebugInfo(debugData);
        setStories(storiesWithDates);
      } else {
        const errorMsg = `Failed to fetch stories: ${response.status} ${response.statusText}`;
        console.error(errorMsg);
        setError(errorMsg);
        setStories([]);

        // Set debug info for error case
        setDebugInfo({
          apiUrl: `${baseUrl}?admin=true`,
          responseStatus: response.status,
          responseOk: response.ok,
          error: errorMsg,
          timestamp: new Date().toISOString(),
        });
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

  const runDirectTest = async () => {
    try {
      console.log("��� Running direct API test (inline route)...");

      const response = await fetch("/api/test-direct");
      console.log(
        "📡 Direct test response status:",
        response.status,
        response.statusText,
      );

      const responseText = await response.text();
      console.log("📄 Direct test response text:", responseText);

      if (response.ok) {
        try {
          const result = JSON.parse(responseText);
          console.log("⚡ Direct test result:", result);
          alert(
            `✅ Direct route test passed!\n\nMessage: ${result.message}\nThis proves basic server routing works.`,
          );
        } catch (parseError) {
          alert(
            `❌ Direct test JSON parsing failed:\n\nResponse: ${responseText}\n\nThis indicates a fundamental JSON issue.`,
          );
        }
      } else {
        alert(
          `❌ Direct test failed: ${response.status} ${response.statusText}\n\nResponse: ${responseText}`,
        );
      }
    } catch (error) {
      console.error("❌ Error running direct test:", error);
      alert(
        `❌ Error running direct test: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const runBasicTest = async () => {
    try {
      console.log("🏁 Running basic API test...");
      console.log("🏁 Current URL:", window.location.href);
      console.log("🏁 Test URL:", window.location.origin + "/api/test-basic");

      const response = await fetch("/api/test-basic");
      console.log(
        "📡 Basic test response status:",
        response.status,
        response.statusText,
      );
      console.log("📡 Basic test response URL:", response.url);
      console.log("📡 Basic test response type:", response.type);
      console.log(
        "📡 Basic test response headers:",
        Array.from(response.headers.entries()),
      );

      const responseText = await response.text();
      console.log(
        "📄 Basic test response text (length:",
        responseText.length,
        ")",
      );
      console.log("📄 Basic test response text:", responseText);
      console.log("📄 Response starts with:", responseText.substring(0, 50));
      console.log(
        "📄 Response ends with:",
        responseText.substring(Math.max(0, responseText.length - 50)),
      );

      // Detailed analysis of what we received
      const analysis = {
        isEmpty: responseText.trim() === "",
        isHTML: responseText.trim().startsWith("<"),
        isJSON:
          responseText.trim().startsWith("{") ||
          responseText.trim().startsWith("["),
        containsHTML:
          responseText.includes("<!DOCTYPE") || responseText.includes("<html"),
        containsError: responseText.toLowerCase().includes("error"),
        contains404:
          responseText.includes("404") || responseText.includes("Not Found"),
        containsAgeVerification:
          responseText.toLowerCase().includes("age") &&
          responseText.toLowerCase().includes("verification"),
        length: responseText.length,
      };

      console.log("📊 Response analysis:", analysis);

      if (analysis.isEmpty) {
        alert(
          "❌ API returned empty response\n\nThis suggests the API endpoint is not working or not registered properly.",
        );
        return;
      }

      if (analysis.isHTML || analysis.containsHTML) {
        alert(
          `❌ API returned HTML instead of JSON\n\nThis suggests:\n- API routing is not working\n- Age verification is blocking the request\n- 404 error page\n\nResponse starts with: "${responseText.substring(0, 100)}"`,
        );
        return;
      }

      if (analysis.contains404) {
        alert(
          "❌ API endpoint not found (404)\n\nThe /api/test-basic endpoint is not registered properly in the server.",
        );
        return;
      }

      if (analysis.containsAgeVerification) {
        alert(
          "❌ Age verification is blocking API access\n\nThe age verification middleware is preventing API calls.",
        );
        return;
      }

      if (!analysis.isJSON) {
        alert(
          `❌ Response is not JSON format\n\nReceived: "${responseText.substring(0, 200)}"\n\nExpected JSON starting with { or [`,
        );
        return;
      }

      // Try to parse JSON
      try {
        const result = JSON.parse(responseText);
        console.log("🏁 Basic test result:", result);

        if (result.success) {
          alert(
            `✅ Basic API test passed!\n\nMessage: ${result.message}\nAPI routing is working correctly.`,
          );
        } else {
          alert(`❌ Basic test failed: ${result.message}`);
        }
      } catch (parseError) {
        console.error("❌ Basic test JSON parsing failed:", parseError);
        console.error("❌ Parse error details:", {
          name: parseError instanceof Error ? parseError.name : "Unknown",
          message: parseError instanceof Error ? parseError.message : "Unknown",
          position:
            parseError instanceof Error && "position" in parseError
              ? parseError.position
              : "Unknown",
        });

        alert(
          `❌ JSON parsing failed despite looking like JSON\n\nResponse: "${responseText}"\n\nParse Error: ${parseError instanceof Error ? parseError.message : "Unknown error"}\n\nThis suggests malformed JSON.`,
        );
      }
    } catch (error) {
      console.error("❌ Error running basic test:", error);
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack",
      );
      alert(
        `❌ Network or fetch error: ${error instanceof Error ? error.message : "Unknown error"}\n\nThis suggests a network connectivity issue.`,
      );
    }
  };

  const runSimpleTest = async () => {
    try {
      console.log("🧪 Running simple diagnostic test...");

      const response = await fetch("/api/test-diagnostic-simple");
      console.log(
        "📡 Simple test response status:",
        response.status,
        response.statusText,
      );
      console.log(
        "📡 Simple test response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (response.ok) {
        const responseText = await response.text();
        console.log(
          "📄 Simple test response text (length:",
          responseText.length,
          "):",
          responseText,
        );
        console.log("📄 Response text type:", typeof responseText);
        console.log(
          "📄 Response text first 100 chars:",
          responseText.substring(0, 100),
        );
        console.log(
          "📄 Response text last 100 chars:",
          responseText.substring(Math.max(0, responseText.length - 100)),
        );

        // Check if response is empty
        if (!responseText || responseText.trim() === "") {
          console.error("❌ Empty response received");
          alert("❌ Empty response received from API");
          return;
        }

        // Check if response looks like HTML (common when there's a routing issue)
        if (responseText.trim().startsWith("<")) {
          console.error(
            "❌ Received HTML instead of JSON:",
            responseText.substring(0, 200),
          );
          alert("❌ Received HTML instead of JSON - check API routing");
          return;
        }

        // Check if response looks like an error page
        if (
          responseText.includes("<!DOCTYPE") ||
          responseText.includes("<html")
        ) {
          console.error(
            "❌ Received HTML error page:",
            responseText.substring(0, 300),
          );
          alert("❌ Received HTML error page instead of JSON response");
          return;
        }

        try {
          const result = JSON.parse(responseText);
          console.log("🧪 Simple test result:", result);
          setTestResult(result);

          if (result.success) {
            alert(
              `✅ Simple test passed!\n\nDatabase: ${result.database_connected ? "Connected" : "Disconnected"}\nStories: ${result.total_stories}\nFirst story: ${result.first_story?.title || "None"}`,
            );
          } else {
            alert(`❌ Simple test failed: ${result.message}`);
          }
        } catch (parseError) {
          console.error("❌ Simple test JSON parsing failed:", parseError);
          console.error("❌ Parse error details:", {
            name: parseError instanceof Error ? parseError.name : "Unknown",
            message:
              parseError instanceof Error
                ? parseError.message
                : "Unknown error",
            stack: parseError instanceof Error ? parseError.stack : "No stack",
          });

          // Try to identify what might be wrong with the JSON
          const trimmed = responseText.trim();
          if (trimmed === "") {
            alert("❌ Empty response - API might not be working");
          } else if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
            alert(
              `❌ Response doesn't look like JSON. Starts with: "${trimmed.substring(0, 50)}"`,
            );
          } else {
            alert(
              `❌ Invalid JSON format. Parse error: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
            );
          }
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Simple test error response:", errorText);
        alert(
          `Simple test failed: ${response.status} ${response.statusText}\n\nResponse: ${errorText.substring(0, 200)}`,
        );
      }
    } catch (error) {
      console.error("❌ Error running simple test:", error);
      console.error("❌ Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack",
      });
      alert(
        `Error running simple test: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const runDatabaseDiagnostic = async () => {
    try {
      setIsRunningDiagnostic(true);
      console.log("🔍 Running database diagnostic...");

      const response = await fetch("/api/database-diagnostic");
      console.log(
        "📡 Diagnostic response status:",
        response.status,
        response.statusText,
      );

      if (response.ok) {
        // Get response as text first to debug parsing issues
        const responseText = await response.text();
        console.log("📄 Raw response text:", responseText);

        try {
          // Try to parse as JSON
          const result = JSON.parse(responseText);
          console.log("📊 Database diagnostic result:", result);
          setDiagnostic(result);
        } catch (parseError) {
          console.error("❌ JSON parsing failed:", parseError);
          console.error("📄 Failed to parse response:", responseText);
          alert(
            `Failed to parse diagnostic response: ${parseError instanceof Error ? parseError.message : "JSON parse error"}`,
          );
          return;
        }
      } else {
        // Handle error response
        try {
          const errorText = await response.text();
          console.error("❌ Error response text:", errorText);

          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText || response.statusText };
          }

          console.error("❌ Failed to run diagnostic:", errorData);
          alert(
            `Failed to run diagnostic: ${errorData.message || response.statusText}`,
          );
        } catch (textError) {
          console.error("❌ Failed to read error response:", textError);
          alert(
            `Failed to run diagnostic: ${response.status} ${response.statusText}`,
          );
        }
      }
    } catch (error) {
      console.error("❌ Error running diagnostic:", error);
      console.error(
        "��� Error stack:",
        error instanceof Error ? error.stack : "No stack trace",
      );
      alert(
        `Error running diagnostic: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const showConnectionDebug = () => {
    const debugInfo = {
      currentURL: window.location.href,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      fetchSupported: typeof fetch !== 'undefined',
      xhrSupported: typeof XMLHttpRequest !== 'undefined',
      timestamp: new Date().toISOString(),
    };

    setConnectionDebug(debugInfo);
    console.log("🔍 Connection Debug Info:", debugInfo);

    alert(`🔍 Connection Debug Info:

URL: ${debugInfo.currentURL}
Protocol: ${debugInfo.protocol}
Hostname: ${debugInfo.hostname}
Port: ${debugInfo.port || 'default'}
Online: ${debugInfo.online}
Fetch Support: ${debugInfo.fetchSupported}
XHR Support: ${debugInfo.xhrSupported}

Check console for full details.`);
  };

  const simpleConnectivityTest = async () => {
    try {
      console.log("🔍 Running simple connectivity test...");

      // Use XMLHttpRequest as fallback to avoid fetch issues
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/test-migration', true);
      xhr.setRequestHeader('Accept', 'application/json');

      const result = await new Promise((resolve, reject) => {
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ success: true, data, status: xhr.status });
            } catch (parseError) {
              resolve({ success: false, error: 'JSON parse error', responseText: xhr.responseText, status: xhr.status });
            }
          } else {
            resolve({ success: false, error: 'HTTP error', status: xhr.status, responseText: xhr.responseText });
          }
        };

        xhr.onerror = function() {
          reject(new Error('Network error'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timeout'));
        };

        xhr.timeout = 10000; // 10 second timeout
        xhr.send();
      });

      if (result.success) {
        alert(`✅ Simple connectivity test successful!\n\nStatus: ${result.status}\nMessage: ${result.data.message}`);
      } else {
        alert(`❌ Simple connectivity test failed: ${result.error}\n\nStatus: ${result.status}\nResponse: ${result.responseText?.substring(0, 200)}`);
      }
    } catch (error) {
      console.error("❌ Simple connectivity test error:", error);
      alert(`❌ Simple connectivity test error: ${error.message}`);
    }
  };

  const testMigrationAPI = async () => {
    let response;
    try {
      console.log("🧪 Testing migration API connectivity...");
      console.log("🔗 Fetching: /api/test-migration");

      response = await fetch("/api/test-migration", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        }
      });

      console.log("📡 Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      // Check if response body is readable
      if (!response.body) {
        throw new Error("Response has no body");
      }

      // Clone response before reading to avoid consumption issues
      const responseClone = response.clone();
      let responseText = "";

      try {
        responseText = await responseClone.text();
        console.log("📄 Response text received:", {
          length: responseText.length,
          preview: responseText.substring(0, 200),
          isEmpty: responseText.trim() === ""
        });
      } catch (textError) {
        console.error("❌ Error reading response text:", textError);
        throw new Error(`Failed to read response: ${textError.message}`);
      }

      if (response.ok) {
        if (!responseText || responseText.trim() === "") {
          alert("❌ Migration API returned empty response");
          return;
        }

        try {
          const result = JSON.parse(responseText);
          console.log("✅ Parsed JSON result:", result);
          alert(`✅ Migration API test successful!\n\nMessage: ${result.message}\nTimestamp: ${result.timestamp}`);
        } catch (parseError) {
          console.error("❌ JSON parse error:", parseError);
          alert(`❌ Test response parsing failed: ${parseError.message}\n\nResponse preview: ${responseText.substring(0, 200)}`);
        }
      } else {
        console.error("❌ Non-OK response:", response.status, response.statusText);
        alert(`❌ Migration API test failed: ${response.status} ${response.statusText}\n\nResponse: ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.error("❌ Error testing migration API:", error);
      console.error("❌ Error type:", typeof error);
      console.error("❌ Error constructor:", error.constructor.name);
      console.error("❌ Error stack:", error.stack);

      // Enhanced error analysis
      let errorMessage = "Unknown error";
      let technicalDetails = "";

      if (error instanceof Error) {
        errorMessage = error.message;
        technicalDetails = `Name: ${error.name}, Constructor: ${error.constructor.name}`;

        if (errorMessage.includes("text@[native code]") || errorMessage.includes("body is disturbed") || errorMessage.includes("locked")) {
          errorMessage = "Response body reading error - the server response was consumed multiple times. This is a browser/fetch API issue.";
        } else if (errorMessage.includes("NetworkError") || errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch")) {
          errorMessage = "Network connection error - check your internet connection or server availability";
        } else if (errorMessage.includes("TypeError") && errorMessage.includes("text")) {
          errorMessage = "Response text reading error - the response body may be corrupted or already consumed";
        }
      }

      alert(`❌ Migration API test error: ${errorMessage}\n\nTechnical details: ${technicalDetails}\n\nCheck the browser console for full details.`);
    }
  };

  const testFieldMapping = async () => {
    try {
      console.log("🔧 Testing field mapping fixes...");

      const response = await fetch("/api/test-field-mapping", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("🔧 Field mapping test result:", result);

        if (result.success && result.testResults) {
          let alertMessage = "✅ Field Mapping Test Results:\n\n";

          result.testResults.forEach((test, index) => {
            alertMessage += `Story ${index + 1}: ${test.title}\n`;
            alertMessage += `  Raw Views: ${test.rawFields.views || 'null'} → Mapped ViewCount: ${test.mappedFields.viewCount}\n`;
            alertMessage += `  Raw Rating: ${test.rawFields.averageRating || 'null'} → Mapped Rating: ${test.mappedFields.rating}\n`;
            alertMessage += `  Rating Count: ${test.rawFields.ratingCount || 0}\n\n`;
          });

          alert(alertMessage);
        } else {
          alert(`❌ Field mapping test failed: ${result.message}`);
        }
      } else {
        const errorText = await response.text();
        alert(`❌ Field mapping test request failed: ${response.status} ${response.statusText}\n\nResponse: ${errorText}`);
      }
    } catch (error) {
      console.error("❌ Error testing field mapping:", error);
      alert(`❌ Error testing field mapping: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const runStatsMigration = async () => {
    if (!confirm("This will update all story stats (views, likes, ratings) to match the views count. Stories with views under 100 will be set to 454. Continue?")) {
      return;
    }

    let response;
    try {
      setIsMigrating(true);
      console.log("🔄 Running stats migration...");
      console.log("🔗 Fetching: /api/migrate-story-stats");

      response = await fetch("/api/migrate-story-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      console.log("📡 Migration response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      // Check if response body is readable
      if (!response.body) {
        throw new Error("Migration API returned no response body");
      }

      // Clone response before reading to avoid consumption issues
      const responseClone = response.clone();
      let responseText = "";

      try {
        responseText = await responseClone.text();
        console.log("📄 Migration response text received:", {
          length: responseText.length,
          preview: responseText.substring(0, 300),
          isEmpty: responseText.trim() === ""
        });
      } catch (textError) {
        console.error("❌ Error reading migration response text:", textError);
        throw new Error(`Failed to read migration response: ${textError.message}`);
      }

      if (response.ok) {
        if (!responseText || responseText.trim() === "") {
          alert("❌ Migration API returned empty response");
          return;
        }

        try {
          const result = JSON.parse(responseText);
          console.log("📊 Migration result parsed:", result);
          setMigrationResult(result);

          if (result.success) {
            alert(
              `✅ Migration completed successfully!\n\n` +
              `Stories processed: ${result.results.summary.totalProcessed}\n` +
              `Updated: ${result.results.summary.successfulUpdates}\n` +
              `Skipped: ${result.results.summary.skippedNoChanges}\n` +
              `Errors: ${result.results.summary.errors}\n` +
              `Views set to 454: ${result.results.summary.viewsSetTo454}`
            );

            // Refresh the stories list to show updated stats
            fetchStories();
          } else {
            alert(`❌ Migration failed: ${result.message}`);
          }
        } catch (parseError) {
          console.error("❌ Failed to parse migration response:", parseError);
          console.error("❌ Response text that failed to parse:", responseText);
          alert(`Migration response parsing failed: ${parseError instanceof Error ? parseError.message : "JSON parse error"}\n\nResponse preview: ${responseText.substring(0, 200)}`);
        }
      } else {
        console.error("❌ Migration error response:", responseText);
        alert(`Migration failed: ${response.status} ${response.statusText}\n\nResponse: ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.error("❌ Error running migration:", error);
      console.error("❌ Error type:", typeof error);
      console.error("❌ Error constructor:", error.constructor.name);
      console.error("❌ Error stack:", error.stack);

      // Enhanced error analysis
      let errorMessage = "Unknown error";
      let technicalDetails = "";

      if (error instanceof Error) {
        errorMessage = error.message;
        technicalDetails = `Name: ${error.name}, Constructor: ${error.constructor.name}`;

        if (errorMessage.includes("text@[native code]") || errorMessage.includes("body is disturbed") || errorMessage.includes("locked")) {
          errorMessage = "Response body reading error - the server response was consumed multiple times. This is a browser/fetch API issue.";
        } else if (errorMessage.includes("NetworkError") || errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch")) {
          errorMessage = "Network connection error - check your internet connection or server availability";
        } else if (errorMessage.includes("TypeError") && errorMessage.includes("text")) {
          errorMessage = "Response text reading error - the response body may be corrupted or already consumed";
        } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          errorMessage = "Migration API endpoint not found - check server configuration";
        }
      }

      alert(`Error running migration: ${errorMessage}\n\nTechnical details: ${technicalDetails}\n\nCheck the browser console for full details.`);
    } finally {
      setIsMigrating(false);
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
              <Button
                variant="outline"
                onClick={showConnectionDebug}
                className="bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
              >
                🔍 Debug
              </Button>
              <Button
                variant="outline"
                onClick={simpleConnectivityTest}
                className="bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-700"
              >
                🔍 Simple Test
              </Button>
              <Button
                variant="outline"
                onClick={testMigrationAPI}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                🧪 Test API
              </Button>
              <Button
                variant="outline"
                onClick={runStatsMigration}
                disabled={isMigrating}
                className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
              >
                {isMigrating ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                    Migrating...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Fix Stats
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={testFieldMapping}
                className="bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
              >
                🔧 Test Fields
              </Button>
              <Button onClick={() => onEditStory(null, "add")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Story
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Debug Information Section */}
      {debugInfo && (
        <div className="container mx-auto px-4 py-4">
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 border-amber-300"
                  >
                    DEBUG INFO
                  </Badge>
                  <span className="text-sm text-amber-700">
                    Stories API Response Analysis
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-amber-700 hover:bg-amber-100"
                  >
                    {showDebug ? "Hide" : "Show"} Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runDirectTest}
                    className="text-pink-700 border-pink-200 hover:bg-pink-50"
                  >
                    ⚡ Direct Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runBasicTest}
                    className="text-purple-700 border-purple-200 hover:bg-purple-50"
                  >
                    🏁 Basic Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runSimpleTest}
                    className="text-green-700 border-green-200 hover:bg-green-50"
                  >
                    🧪 Simple Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runDatabaseDiagnostic}
                    disabled={isRunningDiagnostic}
                    className="text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    {isRunningDiagnostic ? (
                      <>
                        <div className="animate-spin h-3 w-3 mr-2 border border-blue-600 border-t-transparent rounded-full"></div>
                        Running...
                      </>
                    ) : (
                      "🔍 Full Diagnostic"
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-800">
                    {debugInfo.extractedCount || 0}
                  </div>
                  <div className="text-sm text-amber-600">Stories Returned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {debugInfo.publishedCount || 0}
                  </div>
                  <div className="text-sm text-green-600">Published</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-700">
                    {debugInfo.unpublishedCount || 0}
                  </div>
                  <div className="text-sm text-orange-600">Unpublished</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {filteredStories.length}
                  </div>
                  <div className="text-sm text-blue-600">
                    Filtered/Displayed
                  </div>
                </div>
              </div>

              {showDebug && (
                <div className="space-y-4 pt-4 border-t border-amber-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>API URL:</strong> {debugInfo.apiUrl}
                    </div>
                    <div>
                      <strong>Response Status:</strong>{" "}
                      {debugInfo.responseStatus}
                    </div>
                    <div>
                      <strong>Data Format:</strong> {debugInfo.sourceFormat}
                    </div>
                    <div>
                      <strong>Last Updated:</strong>{" "}
                      {new Date(debugInfo.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {debugInfo.warning && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <strong className="text-red-800">Warning:</strong>{" "}
                      {debugInfo.warning}
                    </div>
                  )}

                  {debugInfo.storySample &&
                    debugInfo.storySample.length > 0 && (
                      <div>
                        <strong>Sample Stories (first 5):</strong>
                        <div className="mt-2 space-y-1">
                          {debugInfo.storySample.map(
                            (story: any, index: number) => (
                              <div
                                key={index}
                                className="text-xs bg-white p-2 rounded border"
                              >
                                <span className="font-medium">
                                  {story.title}
                                </span>
                                <span className="text-gray-500">
                                  {" "}
                                  by {story.author}
                                </span>
                                <Badge
                                  variant={
                                    story.isPublished ? "default" : "secondary"
                                  }
                                  className="ml-2 text-xs"
                                >
                                  {story.isPublished ? "Published" : "Draft"}
                                </Badge>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {testResult && (
                    <div className="pt-4 border-t border-amber-200">
                      <strong>🧪 Simple Test Result:</strong>
                      <div className="mt-2 p-3 bg-white rounded border text-sm">
                        <div>
                          Status:{" "}
                          <span
                            className={
                              testResult.success
                                ? "text-green-700 font-medium"
                                : "text-red-700 font-medium"
                            }
                          >
                            {testResult.success ? "✅ Passed" : "❌ Failed"}
                          </span>
                        </div>
                        <div>
                          Database:{" "}
                          <span
                            className={
                              testResult.database_connected
                                ? "text-green-700"
                                : "text-red-700"
                            }
                          >
                            {testResult.database_connected
                              ? "Connected"
                              : "Disconnected"}
                          </span>
                        </div>
                        <div>
                          Total Stories:{" "}
                          <span className="font-medium">
                            {testResult.total_stories || 0}
                          </span>
                        </div>
                        {testResult.first_story && (
                          <div>
                            First Story:{" "}
                            <span className="font-medium">
                              {testResult.first_story.title}
                            </span>{" "}
                            by {testResult.first_story.author}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Database Diagnostic Results */}
      {diagnostic && (
        <div className="container mx-auto px-4 py-4">
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-800 border-blue-300"
                >
                  DATABASE DIAGNOSTIC
                </Badge>
                <span className="text-sm text-blue-700">
                  Complete Database Analysis
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-blue-800">
                      {diagnostic.stories?.total || 0}
                    </div>
                    <div className="text-sm text-blue-600">Total Stories</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-green-700">
                      {diagnostic.stories?.published || 0}
                    </div>
                    <div className="text-sm text-green-600">Published</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-purple-700">
                      {diagnostic.collections?.count || 0}
                    </div>
                    <div className="text-sm text-purple-600">Collections</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-orange-700">
                      {Object.keys(diagnostic.stories?.byAuthor || {}).length}
                    </div>
                    <div className="text-sm text-orange-600">Authors</div>
                  </div>
                </div>

                {/* Issues */}
                {diagnostic.issues && diagnostic.issues.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">
                      ���� Issues Found:
                    </h4>
                    <ul className="space-y-1">
                      {diagnostic.issues.map((issue: string, index: number) => (
                        <li key={index} className="text-red-700 text-sm">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Story Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded border p-4">
                    <h4 className="font-semibold mb-2">Stories by Author</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(diagnostic.stories?.byAuthor || {}).map(
                        ([author, count]) => (
                          <div
                            key={author}
                            className="flex justify-between text-sm"
                          >
                            <span>{author}</span>
                            <span className="font-medium">
                              {count as number}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded border p-4">
                    <h4 className="font-semibold mb-2">Stories by Category</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(diagnostic.stories?.byCategory || {}).map(
                        ([category, count]) => (
                          <div
                            key={category}
                            className="flex justify-between text-sm"
                          >
                            <span>{category}</span>
                            <span className="font-medium">
                              {count as number}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded border p-4">
                  <h4 className="font-semibold mb-2">📅 Recent Activity</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Today:</span>
                      <span className="font-medium ml-1">
                        {diagnostic.stories?.createdToday || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">This Week:</span>
                      <span className="font-medium ml-1">
                        {diagnostic.stories?.createdThisWeek || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">This Month:</span>
                      <span className="font-medium ml-1">
                        {diagnostic.stories?.createdThisMonth || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                {diagnostic.stories?.oldestStory &&
                  diagnostic.stories?.newestStory && (
                    <div className="bg-white rounded border p-4">
                      <h4 className="font-semibold mb-2">📊 Date Range</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Oldest:</span>
                          <div className="font-medium">
                            {diagnostic.stories.oldestStory.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(
                              diagnostic.stories.oldestStory.createdAt,
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Newest:</span>
                          <div className="font-medium">
                            {diagnostic.stories.newestStory.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(
                              diagnostic.stories.newestStory.createdAt,
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Migration Results */}
      {migrationResult && (
        <div className="container mx-auto px-4 py-4">
          <Card className="mb-4 border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800 border-purple-300"
                >
                  STATS MIGRATION RESULTS
                </Badge>
                <span className="text-sm text-purple-700">
                  {migrationResult.success ? "✅ Completed Successfully" : "❌ Failed"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-purple-800">
                      {migrationResult.results?.summary?.totalProcessed || 0}
                    </div>
                    <div className="text-sm text-purple-600">Total Processed</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-green-700">
                      {migrationResult.results?.summary?.successfulUpdates || 0}
                    </div>
                    <div className="text-sm text-green-600">Updated</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-blue-700">
                      {migrationResult.results?.summary?.skippedNoChanges || 0}
                    </div>
                    <div className="text-sm text-blue-600">Skipped</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-orange-700">
                      {migrationResult.results?.summary?.viewsSetTo454 || 0}
                    </div>
                    <div className="text-sm text-orange-600">Set to 454</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-red-700">
                      {migrationResult.results?.summary?.errors || 0}
                    </div>
                    <div className="text-sm text-red-600">Errors</div>
                  </div>
                </div>

                {/* Changes Made */}
                {migrationResult.results?.changes && migrationResult.results.changes.length > 0 && (
                  <div className="bg-white rounded border p-4">
                    <h4 className="font-semibold mb-2">📊 Changes Made (First 5):</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {migrationResult.results.changes.slice(0, 5).map((change: any, index: number) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded border">
                          <div className="font-medium">{change.title}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Views: {change.before.views} → {change.after.views} |
                            Likes: {change.before.likes} → {change.after.likes} |
                            Ratings: {change.before.ratings} → {change.after.ratings}
                          </div>
                        </div>
                      ))}
                      {migrationResult.results.changes.length > 5 && (
                        <div className="text-sm text-gray-500 text-center">
                          ... and {migrationResult.results.changes.length - 5} more changes
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Migration completed at: {new Date(migrationResult.timestamp).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connection Debug Info */}
      {connectionDebug && (
        <div className="container mx-auto px-4 py-4">
          <Card className="mb-4 border-gray-200 bg-gray-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-gray-100 text-gray-800 border-gray-300"
                >
                  CONNECTION DEBUG
                </Badge>
                <span className="text-sm text-gray-700">
                  Environment & Connectivity Information
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Current URL:</strong> {connectionDebug.currentURL}
                  </div>
                  <div>
                    <strong>Protocol:</strong> {connectionDebug.protocol}
                  </div>
                  <div>
                    <strong>Hostname:</strong> {connectionDebug.hostname}
                  </div>
                  <div>
                    <strong>Port:</strong> {connectionDebug.port || 'default'}
                  </div>
                  <div>
                    <strong>Online Status:</strong>
                    <span className={connectionDebug.online ? "text-green-700 ml-1" : "text-red-700 ml-1"}>
                      {connectionDebug.online ? "✅ Online" : "❌ Offline"}
                    </span>
                  </div>
                  <div>
                    <strong>Fetch Support:</strong>
                    <span className={connectionDebug.fetchSupported ? "text-green-700 ml-1" : "text-red-700 ml-1"}>
                      {connectionDebug.fetchSupported ? "✅ Supported" : "❌ Not Supported"}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Debug captured at: {new Date(connectionDebug.timestamp).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                                <Star className="h-3 w-3 text-rating-star fill-current" />
                                <span>{story.rating || 0}</span>
                                <span className="text-gray-400">
                                  ({story.ratingCount || 0})
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{story.viewCount || 0}</span>
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
                              <Heart className="h-3 w-3 text-red-500" />
                              <span>{story.likeCount || 0} likes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{story.commentCount || 0} comments</span>
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
