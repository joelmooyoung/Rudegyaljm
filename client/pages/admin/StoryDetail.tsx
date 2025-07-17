import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Story } from "@shared/api";

// Image compression utility
const compressImage = (
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8,
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

  useEffect(() => {
    if (story) {
      setFormData(story);
      setTagsInput(story.tags?.join(", ") || "");
      // Set image preview if story has an image
      if (story.image) {
        setImagePreview(story.image);
      }
    }
  }, [story]);

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

  // Simple plain text to HTML converter
  const convertPlainTextToHTML = (text: string): string => {
    if (!text) return "";

    return text
      .split("\n\n") // Split into paragraphs
      .map((paragraph) => {
        if (!paragraph.trim()) return "";

        // Basic formatting
        let formatted = paragraph
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") // Bold
          .replace(/\*(.+?)\*/g, "<em>$1</em>") // Italic
          .replace(/`(.+?)`/g, "<code>$1</code>") // Code
          .replace(/\n/g, "<br>"); // Line breaks

        return `<p>${formatted}</p>`;
      })
      .filter((p) => p !== "")
      .join("\n");
  };

  const handlePlainTextConfirm = () => {
    try {
      const htmlContent = convertPlainTextToHTML(plainTextInput);
      handleInputChange("content", htmlContent);
      setPlainTextInput("");
      if (typeof setIsPlainTextDialogOpen === "function") {
        setIsPlainTextDialogOpen(false);
      }
    } catch (error) {
      console.error("Error in handlePlainTextConfirm:", error);
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
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", file);

      // Upload to API
      const response = await fetch("/api/upload-image.js", {
        method: "POST",
        body: formData,
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
        console.log(`Image uploaded successfully: ${imageUrl}`);
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

  const handleSave = () => {
    const storyData: Partial<Story> = {
      ...formData,
      updatedAt: new Date(),
    };

    if (mode === "add") {
      storyData.id = Date.now().toString();
      storyData.createdAt = new Date();
    }

    onSave(storyData);
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
                {mode === "add" ? "Add New Story" : "Edit Story"}
              </h1>
            </div>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {mode === "add" ? "Create Story" : "Save Changes"}
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
                          PNG, JPG, GIF up to 5MB (will be compressed)
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
                        <Label>Plain Text Input</Label>
                        <Textarea
                          placeholder="Paste your story text here..."
                          value={plainTextInput}
                          onChange={(e) => setPlainTextInput(e.target.value)}
                          className="min-h-32"
                        />
                      </div>

                      {plainTextInput && (
                        <div className="space-y-2">
                          <Label>HTML Preview</Label>
                          <div className="border rounded-md p-3 bg-muted/50 text-sm">
                            <code className="text-xs text-muted-foreground block mb-2">
                              HTML Output:
                            </code>
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: convertPlainTextToHTML(plainTextInput),
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsPlainTextDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handlePlainTextConfirm}>
                          <Code className="h-4 w-4 mr-2" />
                          Convert & Use
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
