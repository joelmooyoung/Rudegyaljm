import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  FileText,
  Crown,
  Eye,
  Heart,
  Star,
  Type,
  Code,
  Upload,
  Copy,
  Link,
  X,
  MessageSquare,
} from "lucide-react";
import { Story } from "@shared/api";

// Image compression utility
const compressImage = (
  file: File,
  maxWidth: number = 600,
  quality: number = 0.6,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        if (!ctx) {
          throw new Error("Unable to get canvas context");
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL with compression
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

        // Clean up the object URL
        URL.revokeObjectURL(img.src);

        resolve(compressedDataUrl);
      } catch (error) {
        URL.revokeObjectURL(img.src);
        reject(
          new Error(
            "Failed to compress image: " +
              (error instanceof Error ? error.message : "Unknown error"),
          ),
        );
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image for compression"));
    };

    try {
      img.src = URL.createObjectURL(file);
    } catch (error) {
      reject(new Error("Failed to create object URL for image"));
    }
  });
};

interface StoryDetailProps {
  story?: Story | null;
  mode: "add" | "edit";
  onBack: () => void;
  onSave: (story: Partial<Story>) => void;
}

export default function StoryDetail({
  story,
  mode,
  onBack,
  onSave,
}: StoryDetailProps) {
  const [formData, setFormData] = useState<Partial<Story>>({
    title: "",
    author: "",
    category: "",
    content: "",
    excerpt: "",
    tags: [],
    accessLevel: "free",
    isPublished: mode === "add" ? true : false, // Default to published for new stories
    rating: 0,
    ratingCount: 0,
    viewCount: 0,
    image: "",
    ...story,
  });

  const [plainTextInput, setPlainTextInput] = useState("");
  const [isPlainTextDialogOpen, setIsPlainTextDialogOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Progress tracking for async text conversion
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingTotal, setProcessingTotal] = useState<number>(0);
  const [conversionError, setConversionError] = useState<string>("");

  // Fetch complete story details when editing
  const fetchCompleteStory = async (storyId: string) => {
    try {
      setIsLoadingStory(true);
      setLoadError(null);

      console.log(
        `[STORY DETAIL] Fetching complete story details for ${storyId}`,
      );
      const response = await fetch(`/api/stories/${storyId}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch story: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.success && result.story) {
        const completeStory = result.story;
        console.log(`[STORY DETAIL] ✅ Loaded complete story:`, completeStory);

        setFormData(completeStory);
        setTagsInput(completeStory.tags?.join(", ") || "");

        // Set image preview if story has an image
        if (completeStory.image) {
          setImagePreview(completeStory.image);
        }

        // Set audio URL if story has audio
        if (completeStory.audioUrl) {
          setAudioUrl(completeStory.audioUrl);
        }
      } else {
        throw new Error(result.message || "Failed to load story details");
      }
    } catch (error) {
      console.error(`[STORY DETAIL] ❌ Error loading story:`, error);
      setLoadError(
        error instanceof Error ? error.message : "Failed to load story",
      );
    } finally {
      setIsLoadingStory(false);
    }
  };

  useEffect(() => {
    if (mode === "edit" && story?.id) {
      // For edit mode, fetch complete story details
      fetchCompleteStory(story.id);
    } else if (story) {
      // For add mode or when story data is already complete
      setFormData(story);
      setTagsInput(story.tags?.join(", ") || "");

      // Set image preview if story has an image
      if (story.image) {
        setImagePreview(story.image);
      }

      // Set audio URL if story has audio
      if (story.audioUrl) {
        setAudioUrl(story.audioUrl);
      }
    }
  }, [story, mode]);

  const categories = [
    "Free",
    "Premium",
    "Mystery",
    "Romance",
    "Comedy",
    "Fantasy",
  ];

  const handleInputChange = (field: keyof Story, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tagsArray = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    handleInputChange("tags", tagsArray);
  };

  // Utility to detect headers
  const detectHeader = (text: string): boolean => {
    const trimmed = text.trim();
    return (
      trimmed.length < 60 &&
      (trimmed === trimmed.toUpperCase() || /^[A-Z][a-zA-Z\s]*[^.]$/.test(trimmed)) &&
      !trimmed.includes(".")
    );
  };

  // Asynchronous chunked processing
  const convertPlainTextToHTMLAsync = async (
    text: string,
    chunkSize: number = 50,
    onProgress?: (done: number, total: number) => void
  ): Promise<string> => {
    const paragraphs = text.split("\n\n");
    let htmlChunks: string[] = [];

    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      const chunk = paragraphs.slice(i, i + chunkSize);
      htmlChunks.push(
        ...chunk.map((paragraph) => {
          if (!paragraph.trim()) return "";

          const trimmed = paragraph.trim();

          if (detectHeader(trimmed)) {
            return `<h2 style="margin: 1.5em 0 0.5em 0; font-size: 1.2em; font-weight: bold;">${trimmed}</h2>`;
          }

          // Paragraph with formatting
          let formatted = paragraph
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/`(.+?)`/g, "<code>$1</code>")
            .replace(/\n/g, "<br>");

          return `<p style="margin: 1em 0; line-height: 1.6;">${formatted}</p>`;
        })
      );

      if (onProgress) onProgress(Math.min(i + chunk.length, paragraphs.length), paragraphs.length);

      // Yield to browser to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return htmlChunks.filter((p) => p !== "").join("\n");
  };

  // Simple synchronous converter for small texts
  const convertPlainTextToHTML = (text: string): string => {
    if (!text) return "";

    return text
      .split("\n\n")
      .map((paragraph) => {
        if (!paragraph.trim()) return "";

        const trimmed = paragraph.trim();

        if (detectHeader(trimmed)) {
          return `<h2 style="margin: 1.5em 0 0.5em 0; font-size: 1.2em; font-weight: bold;">${trimmed}</h2>`;
        }

        let formatted = paragraph
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>")
          .replace(/`(.+?)`/g, "<code>$1</code>")
          .replace(/\n/g, "<br>");

        return `<p style="margin: 1em 0; line-height: 1.6;">${formatted}</p>`;
      })
      .filter((p) => p !== "")
      .join("\n");
  };


  // Debounced preview calculation to prevent freezing during typing
  const [debouncedPlainText, setDebouncedPlainText] = useState("");
  const [isProcessingPreview, setIsProcessingPreview] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPlainText(plainTextInput);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [plainTextInput]);

  // Memoized HTML preview with better performance protection
  const htmlPreview = useMemo(() => {
    if (!debouncedPlainText) return "";

    // Disable preview for large text to prevent freezing
    if (debouncedPlainText.length > 3000) {
      const characterCount = debouncedPlainText.length.toLocaleString();
      return `<p><em>Preview disabled for large text (${characterCount} characters) to prevent interface freezing. Text is ready for conversion.</em></p>`;
    }

    // For medium text, show preview but with warning
    if (debouncedPlainText.length > 1000) {
      const characterCount = debouncedPlainText.length.toLocaleString();
      return (
        `<p><em>Large text (${characterCount} characters). Preview may be slow to update.</em></p><hr/>` +
        convertPlainTextToHTML(debouncedPlainText)
      );
    }

    return convertPlainTextToHTML(debouncedPlainText);
  }, [debouncedPlainText]);

  const handlePlainTextConfirm = async () => {
    setIsProcessingPreview(true);
    setProcessingProgress(0);
    setProcessingTotal(0);
    setConversionError("");

    try {
      // Validate input
      if (!plainTextInput.trim()) {
        setConversionError("Please enter some text to convert.");
        return;
      }

      // Check for extremely large text
      if (plainTextInput.length > 100000) {
        setConversionError("Text is too large (>100,000 characters). Please break it into smaller sections.");
        return;
      }

      // Check text size and decide on processing method
      const textLength = plainTextInput.length;
      const paragraphCount = plainTextInput.split("\n\n").length;

      console.log(`Converting text: ${textLength} chars, ${paragraphCount} paragraphs`);

      // For large texts, use async processing with progress tracking
      if (textLength > 3000 || paragraphCount > 100) {
        console.log("Using async processing for large text");

        const htmlContent = await convertPlainTextToHTMLAsync(
          plainTextInput,
          50, // chunk size
          (done, total) => {
            setProcessingProgress(done);
            setProcessingTotal(total);
          }
        );

        if (!htmlContent || htmlContent.trim() === "") {
          throw new Error("Conversion resulted in empty content");
        }

        handleInputChange("content", htmlContent);
      } else {
        // For smaller texts, use synchronous processing
        console.log("Using sync processing for small text");
        const htmlContent = convertPlainTextToHTML(plainTextInput);

        if (!htmlContent || htmlContent.trim() === "") {
          throw new Error("Conversion resulted in empty content");
        }

        handleInputChange("content", htmlContent);
      }

      // Success - clear form and close dialog
      setPlainTextInput("");
      setConversionError("");
      setIsPlainTextDialogOpen(false);

      console.log("Text conversion completed successfully");
    } catch (err) {
      console.error("Text conversion error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown conversion error";
      setConversionError(errorMessage);

      // Don't close dialog on error - let user fix the issue
    } finally {
      setIsProcessingPreview(false);
      setProcessingProgress(0);
      setProcessingTotal(0);
    }
  };

  // Handle image file upload using API
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setIsUploadingImage(true);
    setImageFile(file);

    try {
      // Compress image before upload
      const compressedImageData = await compressImage(file, 600, 0.6);

      // Upload compressed image to API
      const response = await fetch("/api/upload-image.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: compressedImageData,
          filename: file.name,
          maxWidth: 600,
          quality: 0.6,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      if (result.success) {
        const imageUrl = result.imageUrl;
        setImagePreview(imageUrl);
        handleInputChange("image", imageUrl);

        // Show compression info if available
        if (
          result.compressionRatio &&
          result.originalSize &&
          result.compressedSize
        ) {
          console.log(
            `Image uploaded and compressed successfully:\n` +
              `Original: ${(result.originalSize / 1024).toFixed(1)}KB\n` +
              `Compressed: ${(result.compressedSize / 1024).toFixed(1)}KB\n` +
              `Saved: ${result.compressionRatio}`,
          );
        } else {
          console.log(`Image uploaded successfully`);
        }
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert(
        `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    handleInputChange("image", "");
  };

  // Handle audio file upload - client-side base64 conversion for Vercel compatibility
  const handleAudioUpload = async (file: File) => {
    // Check if file is audio by MIME type or file extension
    const isAudioByType = file.type.startsWith("audio/");
    const isAudioByExtension = /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);

    if (!isAudioByType && !isAudioByExtension) {
      alert(
        "Please select a valid audio file (MP3, WAV, OGG, M4A, AAC, FLAC).",
      );
      return;
    }

    // Check file size - account for base64 expansion (33% larger)
    const isProduction =
      window.location.hostname.includes("vercel.app") ||
      window.location.hostname.includes("fly.dev") ||
      window.location.hostname !== "localhost";

    // Base64 encoding makes files ~33% larger, so we need to account for that
    const maxRawSize = isProduction ? 3 * 1024 * 1024 : 50 * 1024 * 1024; // 3MB raw for prod (becomes ~4MB base64)
    const maxSizeMB = Math.floor(maxRawSize / 1024 / 1024);

    if (file.size > maxRawSize) {
      alert(
        `Audio file must be smaller than ${maxSizeMB}MB for ${isProduction ? "production" : "development"} uploads. (Base64 encoding increases size by ~33%)`,
      );
      return;
    }

    setIsUploadingAudio(true);
    setAudioFile(file);

    try {
      console.log(
        "[ADMIN AUDIO] Converting audio to base64 on client side for Vercel compatibility...",
      );
      console.log("[ADMIN AUDIO] File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        isProduction: isProduction,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        estimatedBase64MB: ((file.size * 1.33) / 1024 / 1024).toFixed(2),
      });

      // Convert audio to base64 on client side (Vercel-compatible approach)
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64SizeMB = (result.length / 1024 / 1024).toFixed(2);
          console.log(
            "[ADMIN AUDIO] Base64 conversion successful, length:",
            result.length,
            "size:",
            base64SizeMB + "MB",
          );

          // Check if base64 is too large for network request
          if (result.length > 10 * 1024 * 1024) {
            // 10MB limit
            reject(
              new Error(
                `Base64 audio too large: ${base64SizeMB}MB. Use a smaller file.`,
              ),
            );
            return;
          }

          resolve(result);
        };
        reader.onerror = (error) => {
          console.error("[ADMIN AUDIO] FileReader error:", error);
          reject(new Error("Failed to read audio file"));
        };
        reader.readAsDataURL(file);
      });

      console.log("[ADMIN AUDIO] Sending to server...");
      const requestData = {
        audioData: base64Audio,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      };

      console.log("[ADMIN AUDIO] Request data:", {
        ...requestData,
        audioData: requestData.audioData.substring(0, 100) + "...(truncated)",
      });

      // Send base64 data as JSON (much more reliable on Vercel)
      const response = await fetch("/api/upload-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("[ADMIN AUDIO] Response status:", response.status);
      console.log(
        "[ADMIN AUDIO] Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (response.ok) {
        const result = await response.json();
        console.log("[ADMIN AUDIO] ✅ Upload successful:", result);
        setAudioUrl(result.audioUrl);
        handleInputChange("audioUrl", result.audioUrl);
        alert("Audio uploaded successfully!");
      } else {
        const errorData = await response.text();
        console.error(
          "[ADMIN AUDIO] ❌ Upload failed:",
          response.status,
          response.statusText,
          errorData,
        );
        alert(
          `Failed to upload audio: ${response.status} ${response.statusText}\n${errorData}`,
        );
      }
    } catch (error) {
      console.error("[ADMIN AUDIO] ❌ Upload error:", error);
      alert(
        `Failed to upload audio: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Remove audio
  const removeAudio = () => {
    setAudioFile(null);
    setAudioUrl("");
    handleInputChange("audioUrl", "");
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log("[STORY DETAIL] Starting save process...");

    try {
      const storyData: Partial<Story> = {
        ...formData,
        updatedAt: new Date(),
      };

      if (mode === "add") {
        storyData.id = Date.now().toString();
        storyData.createdAt = new Date();
        await onSave(storyData);
      } else {
        // For edit mode, use the individual story API
        console.log(`[STORY DETAIL] Updating story ${formData.id} via API`);

        const response = await fetch(`/api/stories/${formData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(storyData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to update story: ${response.status}`,
          );
        }

        const result = await response.json();
        console.log("[STORY DETAIL] ✅ Story updated via API:", result);

        // Call onSave to refresh the parent component
        await onSave(storyData);
      }

      console.log("[STORY DETAIL] Save completed successfully");
    } catch (error) {
      console.error("[STORY DETAIL] Save failed:", error);
      // Show error to user
      alert(
        `Failed to save story: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const stripHTML = (html: string): string => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  // Show loading state while fetching complete story details
  if (isLoadingStory) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Loading Story Details</h2>
          <p className="text-muted-foreground">
            Fetching complete story information...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if loading failed
  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="h-12 w-12 text-destructive mx-auto mb-4">
            <FileText className="h-full w-full" />
          </div>
          <h2 className="text-lg font-semibold mb-2 text-destructive">
            Failed to Load Story
          </h2>
          <p className="text-muted-foreground mb-4">{loadError}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stories
            </Button>
            {story?.id && (
              <Button onClick={() => fetchCompleteStory(story.id)}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
                {mode === "add" ? "Add New Story" : "Edit Story"}
              </h1>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving || isUploadingAudio || isLoadingStory}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "add" ? "Create Story" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details about the story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter story title"
                    value={formData.title || ""}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="Enter author name"
                    value={formData.author || ""}
                    onChange={(e) =>
                      handleInputChange("author", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category || ""}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    placeholder="romance, drama, passion"
                    value={tagsInput}
                    onChange={(e) => handleTagsChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description or teaser for the story..."
                  value={formData.excerpt || ""}
                  onChange={(e) => handleInputChange("excerpt", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <Label>Story Image</Label>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Upload Image</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {isUploadingImage
                            ? "Processing..."
                            : "Click to upload image"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          PNG, JPG, GIF, WebP - Images will be compressed
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Image Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Preview</Label>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>

                    {imagePreview ? (
                      <div className="border rounded-md overflow-hidden bg-muted/20">
                        <img
                          src={imagePreview}
                          alt="Story preview"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="border rounded-md bg-muted/20 h-48 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Upload className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm">No image selected</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audio Upload Section */}
              <div className="space-y-4">
                <Label>Story Audio (Optional)</Label>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Upload Audio</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAudioUpload(file);
                        }}
                        className="hidden"
                        id="audio-upload"
                      />
                      <label
                        htmlFor="audio-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {isUploadingAudio
                            ? "Uploading..."
                            : "Click to upload audio"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          MP3, WAV, OGG - Max 4MB for production, 50MB for
                          development
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Audio Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Audio Preview</Label>
                      {audioUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeAudio}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>

                    {audioUrl ? (
                      <div className="border rounded-md p-4 bg-muted/20">
                        <audio controls className="w-full" preload="metadata">
                          <source src={audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                        <p className="text-xs text-muted-foreground mt-2">
                          Audio file ready for listeners
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-md bg-muted/20 h-24 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">No audio file selected</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Premium checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="premium"
                  checked={formData.accessLevel === "premium"}
                  onCheckedChange={(checked) =>
                    handleInputChange(
                      "accessLevel",
                      checked ? "premium" : "free",
                    )
                  }
                />
                <Label htmlFor="premium" className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-premium" />
                  Premium Story
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Content Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Story Content</CardTitle>
                  <CardDescription>
                    Write your story content using HTML formatting
                  </CardDescription>
                </div>
                <Dialog
                  open={isPlainTextDialogOpen}
                  onOpenChange={setIsPlainTextDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Type className="h-4 w-4 mr-2" />
                      Paste Plain Text
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Convert Plain Text to HTML</DialogTitle>
                      <DialogDescription>
                        Paste your plain text here. Basic formatting will be
                        converted: **bold**, *italic*, `code`, and paragraph
                        breaks.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Plain Text Input</Label>
                          <span className="text-xs text-muted-foreground">
                            {plainTextInput.length.toLocaleString()} characters
                            {isProcessingPreview && processingTotal > 0 && (
                              <span className="text-blue-600 ml-2">
                                🔄 Processing {processingProgress}/{processingTotal}...
                              </span>
                            )}
                            {isProcessingPreview && processingTotal === 0 && (
                              <span className="text-blue-600 ml-2">
                                🔄 Processing...
                              </span>
                            )}
                            {!isProcessingPreview &&
                              (plainTextInput.length > 3000 || plainTextInput.split('\n\n').length > 100) && (
                                <span className="text-orange-600 ml-2">
                                  ⚡ Async processing will be used
                                </span>
                              )}
                            {!isProcessingPreview &&
                              plainTextInput.length > 1000 &&
                              plainTextInput.length <= 3000 && (
                                <span className="text-yellow-600 ml-2">
                                  ⚠️ Large text - preview may be slow
                                </span>
                              )}
                            {!isProcessingPreview &&
                              plainTextInput.length > 50000 && (
                                <span className="text-red-600 ml-2">
                                  🚨 Very large text - consider breaking into sections
                                </span>
                              )}
                          </span>
                        </div>
                        <Textarea
                          placeholder="Paste your story text here..."
                          value={plainTextInput}
                          onChange={(e) => {
                            setPlainTextInput(e.target.value);
                            // Clear any previous conversion errors when user types
                            if (conversionError) {
                              setConversionError("");
                            }
                          }}
                          className="min-h-80 max-h-96 overflow-y-auto resize-y"
                        />
                      </div>

                      {/* Progress indicator for large text processing */}
                      {isProcessingPreview && processingTotal > 0 && (
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Processing large text...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {processingProgress} / {processingTotal} paragraphs
                            </p>
                            {/* Progress bar */}
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${(processingProgress / processingTotal) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* HTML Preview - only show when not processing */}
                      {plainTextInput && !isProcessingPreview && (
                        <div className="space-y-2">
                          <Label>HTML Preview</Label>
                          <div className="border rounded-md p-3 bg-muted/50 text-sm">
                            <code className="text-xs text-muted-foreground block mb-2">
                              HTML Output:{" "}
                              {plainTextInput.length.toLocaleString()} chars
                              {plainTextInput.length > 3000 &&
                                " (Preview disabled for large text)"}
                              {plainTextInput.length > 1000 &&
                                plainTextInput.length <= 3000 &&
                                " (Large text warning)"}
                            </code>
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: htmlPreview,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Error display */}
                      {conversionError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700 font-medium">
                            ❌ Conversion Error
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            {conversionError}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsPlainTextDialogOpen(false)}
                          disabled={isProcessingPreview}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handlePlainTextConfirm}
                          disabled={
                            isProcessingPreview || !plainTextInput.trim()
                          }
                        >
                          {isProcessingPreview ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                              {processingTotal > 0
                                ? `Processing ${processingProgress}/${processingTotal}...`
                                : "Processing..."
                              }
                            </>
                          ) : (
                            <>
                              <Code className="h-4 w-4 mr-2" />
                              {plainTextInput.length > 3000 || plainTextInput.split('\n\n').length > 100
                                ? "Convert Large Text"
                                : "Convert & Use"
                              }
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Content (HTML)</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your story content with HTML formatting..."
                  value={formData.content || ""}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  className="min-h-64 font-mono text-sm"
                />
              </div>

              {/* Live Preview */}
              {formData.content && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-md p-4 bg-card/50 max-h-64 overflow-y-auto">
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Section */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>
                Story performance metrics and engagement data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="views" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Views
                  </Label>
                  <Input
                    id="views"
                    type="number"
                    min="0"
                    value={formData.viewCount || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "viewCount",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Rating (1-5)
                  </Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "rating",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="ratingCount"
                    className="flex items-center gap-2"
                  >
                    <Heart className="h-4 w-4" />
                    Rating Count
                  </Label>
                  <Input
                    id="ratingCount"
                    type="number"
                    min="0"
                    value={formData.ratingCount || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "ratingCount",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </div>

              {/* Additional Statistics Row */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="commentCount"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </Label>
                  <Input
                    id="commentCount"
                    type="number"
                    min="0"
                    value={formData.commentCount || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "commentCount",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="likeCount"
                    className="flex items-center gap-2"
                  >
                    <Heart className="h-4 w-4 text-red-500" />
                    Likes
                  </Label>
                  <Input
                    id="likeCount"
                    type="number"
                    min="0"
                    value={formData.likeCount || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "likeCount",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </div>

              {/* Publishing Status */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="published"
                    checked={formData.isPublished || false}
                    onCheckedChange={(checked) =>
                      handleInputChange("isPublished", checked)
                    }
                  />
                  <Label
                    htmlFor="published"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Published (visible to users)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
