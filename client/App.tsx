import "./global.css";

import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AgeVerification from "./pages/AgeVerification";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import StoryMaintenance from "./pages/admin/StoryMaintenance";
import StoryDetail from "./pages/admin/StoryDetail";
import CommentsMaintenance from "./pages/admin/CommentsMaintenance";
import StoryReader from "./pages/StoryReader";
import UserMaintenance from "./pages/admin/UserMaintenance";
import LoginLogs from "./pages/admin/LoginLogs";
import ErrorLogs from "./pages/admin/ErrorLogs";
import { User, Story } from "@shared/api";

const queryClient = new QueryClient();

const App = () => {
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>("home");
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [storyMode, setStoryMode] = useState<"add" | "edit">("add");
  const [readingStory, setReadingStory] = useState<Story | null>(null);

  useEffect(() => {
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
        id: "1",
        email: "user@example.com",
        username: "reader123",
        role: "free",
        isAgeVerified: true,
        subscriptionStatus: "none",
        createdAt: new Date(),
      };
      setUser(mockUser);
    }

    setIsLoading(false);
  }, []);

  const handleAgeVerified = () => {
    setIsAgeVerified(true);
    sessionStorage.setItem("age_verified", "true");
  };

  const handleAuthenticated = (authenticatedUser: User) => {
    setUser(authenticatedUser);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAgeVerified) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AgeVerification onVerified={handleAgeVerified} />
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
      case "admin-users":
        return <UserMaintenance onBack={handleBackToHome} />;
      case "admin-login-logs":
        return <LoginLogs onBack={handleBackToHome} />;
      case "admin-error-logs":
        return <ErrorLogs onBack={handleBackToHome} />;
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

createRoot(document.getElementById("root")!).render(<App />);
