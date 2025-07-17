import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AgeVerification from "./pages/AgeVerificationSimple";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import StoryMaintenance from "./pages/admin/StoryMaintenance";
import StoryDetail from "./pages/admin/StoryDetail";
import CommentsMaintenance from "./pages/admin/CommentsMaintenance";
import UserMaintenance from "./pages/admin/UserMaintenance";
import UserDetail from "./pages/admin/UserDetail";
import StoryReader from "./pages/StoryReader";
import LoginLogs from "./pages/admin/LoginLogs";
import ErrorLogs from "./pages/admin/ErrorLogs";
import DatabaseSeeding from "./pages/DatabaseSeeding";
import DirectSeed from "./pages/DirectSeed";
import { User, Story } from "@shared/api";

const queryClient = new QueryClient();

const App = () => {
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("App starting...");

  // Add error handling
  useEffect(() => {
    console.log("🚀 App component mounted");
    setDebugInfo("App component mounted");

    window.addEventListener("error", (e) => {
      console.error("🚨 Window error:", e.error);
      setDebugInfo("Error: " + e.message);
    });

    return () => {
      window.removeEventListener("error", () => {});
    };
  }, []);
  const [currentView, setCurrentView] = useState<string>("home");
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [storyMode, setStoryMode] = useState<"add" | "edit">("add");
  const [readingStory, setReadingStory] = useState<Story | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMode, setUserMode] = useState<"add" | "edit">("add");

  useEffect(() => {
    // Multiple ways to detect development mode
    const urlParams = new URLSearchParams(window.location.search);
    const devParam = urlParams.get("dev") === "true";
    const adminHash = window.location.hash.includes("admin-seeding");
    const isBuilderEnv = window.location.hostname.includes("builder.my");
    const isVercelEnv = window.location.hostname.includes("vercel.app");

    // Force dev mode for Builder.io environment (override for testing)
    const forceDevMode =
      isBuilderEnv || window.location.hostname.includes("projects.builder.my");

    // Force dev mode in Builder.io OR Vercel environment
    const devMode =
      devParam || adminHash || isBuilderEnv || isVercelEnv || forceDevMode;

    console.log("Dev mode checks:", {
      devParam,
      adminHash,
      isBuilderEnv,
      isVercelEnv,
      forceDevMode,
      hostname: window.location.hostname,
      devMode,
      finalResult: `devmode=${devMode}`,
    });

    // Always create admin user in Builder.io environment
    if (devMode) {
      const devAdminUser: User = {
        id: "dev-admin-1",
        email: "admin@dev.com",
        username: "DevAdmin",
        role: "admin",
        isAgeVerified: true,
        isActive: true,
        subscriptionStatus: "active",
        createdAt: new Date(),
        lastLogin: new Date(),
      };
      setUser(devAdminUser);
      setIsAgeVerified(true);
      sessionStorage.setItem("age_verified", "true");
      localStorage.setItem("token", "dev-admin-token");

      // If admin-seeding in hash, navigate there directly
      if (adminHash) {
        setCurrentView("admin-seeding");
      }

      console.log("Dev mode activated, admin user created");
    } else {
      // Check if user has already been age verified in this session
      const verified = sessionStorage.getItem("age_verified");
      if (verified === "true") {
        setIsAgeVerified(true);
      }

      // Check if user is already authenticated
      const token = localStorage.getItem("token");
      if (token) {
        // In a real app, you'd verify the token with the server
        // For now, we'll create a mock user
        const mockUser: User = {
          id: "mock-user-1",
          email: "test@example.com",
          username: "TestUser",
          role: "admin", // Make sure they can access seeding
          isAgeVerified: true,
          isActive: true,
          subscriptionStatus: "none",
          createdAt: new Date(),
          lastLogin: new Date(),
        };
        setUser(mockUser);
      }
    }

    setIsLoading(false);
  }, []);

  const handleAgeVerification = (verified: boolean) => {
    setIsAgeVerified(verified);
    if (verified) {
      sessionStorage.setItem("age_verified", "true");
    }
  };

  const handleAuthenticated = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem("token", "mock-token");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    setCurrentView("home");
  };

  const handleNavigateToAdmin = (section: string) => {
    setCurrentView(`admin-${section}`);
  };

  const handleBackToHome = () => {
    setCurrentView("home");
  };

  const handleEditStory = (story: Story | null, mode: "add" | "edit") => {
    setCurrentStory(story);
    setStoryMode(mode);
    setCurrentView("admin-story-detail");
  };

  const handleBackToStories = () => {
    setCurrentView("admin-stories");
  };

  const handleCommentsMaintenance = () => {
    setCurrentView("admin-comments");
  };

  const handleReadStory = (story: Story) => {
    setReadingStory(story);
    setCurrentView("story-reader");
  };

  const handleBackFromReader = () => {
    setReadingStory(null);
    setCurrentView("home");
  };

  const handleNavigateToAbout = () => {
    setCurrentView("about");
  };

  const handleNavigateToContact = () => {
    setCurrentView("contact");
  };

  const handleNavigateToHelp = () => {
    setCurrentView("help");
  };

  const handleSaveStory = async (storyData: Partial<Story>) => {
    try {
      let response;
      if (storyMode === "add") {
        // Create new story
        response = await fetch("/api/stories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(storyData),
        });
      } else {
        // Update existing story
        response = await fetch(`/api/stories/${storyData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(storyData),
        });
      }

      if (response.ok) {
        const savedStory = await response.json();
        console.log("Story saved successfully:", savedStory);
        // Navigate back to story maintenance
        setCurrentView("admin-stories");
      } else {
        console.error("Failed to save story:", response.statusText);
        alert("Failed to save story. Please try again.");
      }
    } catch (error) {
      console.error("Error saving story:", error);
      alert("Error saving story. Please try again.");
    }
  };

  const handleEditUser = (user: User | null, mode: "add" | "edit") => {
    setCurrentUser(user);
    setUserMode(mode);
    setCurrentView("admin-user-detail");
  };

  const handleBackToUsers = () => {
    setCurrentView("admin-users");
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      let response;
      if (userMode === "add") {
        // Create new user
        response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      } else {
        // Update existing user
        response = await fetch(`/api/users/${userData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      }

      if (response.ok) {
        const savedUser = await response.json();
        console.log("User saved successfully:", savedUser);
        // Navigate back to user maintenance
        setCurrentView("admin-users");
      } else {
        console.error("Failed to save user:", response.statusText);
        alert("Failed to save user. Please try again.");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error saving user. Please try again.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        console.log("User deleted successfully");
        // Navigate back to user maintenance
        setCurrentView("admin-users");
      } else {
        console.error("Failed to delete user:", response.statusText);
        alert("Failed to delete user. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Loading... (DEV MODE TEST)
              </p>
            </div>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // For development, we'll skip age verification if a specific query param is present
  const urlParams = new URLSearchParams(window.location.search);
  const skipAgeVerification = urlParams.get("dev") === "true";
  const directSeed = urlParams.get("seed") === "true";
  const isBuilderEnvironment = window.location.hostname.includes("builder.my");
  const isVercelEnvironment = window.location.hostname.includes("vercel.app");

  console.log("Age verification check:", {
    isAgeVerified,
    skipAgeVerification,
    isBuilderEnvironment,
    isVercelEnvironment,
    hostname: window.location.hostname,
  });

  // Always skip age verification in Builder.io OR Vercel environment
  if (
    !isAgeVerified &&
    !skipAgeVerification &&
    !isBuilderEnvironment &&
    !isVercelEnvironment
  ) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AgeVerification onVerified={() => handleAgeVerification(true)} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Direct access to seed page for setup
  if (directSeed) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <DirectSeed />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Auth onAuthenticated={handleAuthenticated} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  const renderCurrentView = () => {
    if (user?.role !== "admin" && currentView.startsWith("admin-")) {
      // Non-admin users cannot access admin sections
      setCurrentView("home");
      return (
        <Home
          user={user}
          onLogout={handleLogout}
          onNavigateToAdmin={handleNavigateToAdmin}
        />
      );
    }

    switch (currentView) {
      case "admin-stories":
        return (
          <StoryMaintenance
            onBack={handleBackToHome}
            onEditStory={handleEditStory}
            onCommentsMaintenance={handleCommentsMaintenance}
          />
        );
      case "admin-story-detail":
        return (
          <StoryDetail
            story={currentStory}
            mode={storyMode}
            onBack={handleBackToStories}
            onSave={handleSaveStory}
          />
        );
      case "story-reader":
        return readingStory && user ? (
          <StoryReader
            story={readingStory}
            user={user}
            onBack={handleBackFromReader}
          />
        ) : (
          <Home
            user={user}
            onLogout={handleLogout}
            onNavigateToAdmin={handleNavigateToAdmin}
            onReadStory={handleReadStory}
            onNavigateToAbout={handleNavigateToAbout}
            onNavigateToContact={handleNavigateToContact}
            onNavigateToHelp={handleNavigateToHelp}
          />
        );
      case "admin-comments":
        return <CommentsMaintenance onBack={handleBackToStories} />;
      case "admin-users":
        return (
          <UserMaintenance
            onBack={handleBackToHome}
            onEditUser={handleEditUser}
          />
        );
      case "admin-user-detail":
        return (
          <UserDetail
            user={currentUser}
            mode={userMode}
            onBack={handleBackToUsers}
            onSave={handleSaveUser}
            onDelete={handleDeleteUser}
          />
        );
      case "admin-login-logs":
        return <LoginLogs onBack={handleBackToHome} />;
      case "admin-error-logs":
        return <ErrorLogs onBack={handleBackToHome} />;
      case "admin-seeding":
        return <DatabaseSeeding />;
      case "direct-seed":
        return <DirectSeed />;
      case "about":
        return <About onBack={handleBackToHome} />;
      case "contact":
        return <Contact onBack={handleBackToHome} />;
      case "help":
        return <Help onBack={handleBackToHome} />;
      case "home":
      default:
        return (
          <Home
            user={user}
            onLogout={handleLogout}
            onNavigateToAdmin={handleNavigateToAdmin}
            onReadStory={handleReadStory}
            onNavigateToAbout={handleNavigateToAbout}
            onNavigateToContact={handleNavigateToContact}
            onNavigateToHelp={handleNavigateToHelp}
          />
        );
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {renderCurrentView()}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
