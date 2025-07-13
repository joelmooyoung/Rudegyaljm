import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Search,
  Crown,
  ArrowLeft,
} from "lucide-react";
import { Story } from "@shared/api";

// Mock stories for admin view
const mockStories: Story[] = [
  {
    id: "1",
    title: "Midnight Desires",
    excerpt: "A passionate tale of forbidden romance...",
    content: "Full story content here...",
    author: "Elena Rossini",
    category: "Romance",
    tags: ["passion", "forbidden", "dark"],
    accessLevel: "free",
    isPublished: true,
    rating: 4.8,
    ratingCount: 234,
    viewCount: 1542,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "The Executive's Secret",
    excerpt: "Power, money, and desire collide...",
    content: "Full premium story content here...",
    author: "Marcus Steel",
    category: "Thriller",
    tags: ["corporate", "power", "secrets"],
    accessLevel: "premium",
    isPublished: true,
    rating: 4.9,
    ratingCount: 156,
    viewCount: 892,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
];

interface StoryMaintenanceProps {
  onBack: () => void;
}

export default function StoryMaintenance({ onBack }: StoryMaintenanceProps) {
  const [stories, setStories] = useState<Story[]>(mockStories);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Story>>({});

  const filteredStories = stories.filter(
    (story) =>
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (story: Story) => {
    setSelectedStory(story);
    setEditForm(story);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (selectedStory && editForm) {
      const updatedStories = stories.map((story) =>
        story.id === selectedStory.id
          ? { ...story, ...editForm, updatedAt: new Date() }
          : story,
      );
      setStories(updatedStories);
      setIsEditing(false);
      setSelectedStory(null);
      setEditForm({});
    }
  };

  const handleDelete = (storyId: string) => {
    if (confirm("Are you sure you want to delete this story?")) {
      setStories(stories.filter((story) => story.id !== storyId));
    }
  };

  const togglePublished = (storyId: string) => {
    const updatedStories = stories.map((story) =>
      story.id === storyId
        ? { ...story, isPublished: !story.isPublished, updatedAt: new Date() }
        : story,
    );
    setStories(updatedStories);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
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
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Story
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Story</DialogTitle>
                  <DialogDescription>
                    Create a new story for the platform
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input placeholder="Story title" />
                    </div>
                    <div className="space-y-2">
                      <Label>Author</Label>
                      <Input placeholder="Author name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Excerpt</Label>
                    <Textarea placeholder="Brief description..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      placeholder="Full story content..."
                      className="min-h-32"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select>\n                        <SelectTrigger>\n                          <SelectValue />\n                        </SelectTrigger>\n                        <SelectContent>\n                          <SelectItem value="romance">Romance</SelectItem>\n                          <SelectItem value="thriller">Thriller</SelectItem>\n                          <SelectItem value="contemporary">\n                            Contemporary\n                          </SelectItem>\n                          <SelectItem value="fantasy">Fantasy</SelectItem>\n                        </SelectContent>\n                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Access Level</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <Input placeholder="tag1, tag2, tag3" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Create Story</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stories List */}
        <div className="space-y-4">
          {filteredStories.map((story) => (
            <Card key={story.id} className="bg-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {story.title}
                      {!story.isPublished && (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      <Badge
                        variant={
                          story.accessLevel === "premium" ? "default" : "outline"
                        }
                        className={
                          story.accessLevel === "premium"
                            ? "bg-premium text-primary-foreground"
                            : ""
                        }
                      >
                        {story.accessLevel === "premium" && (
                          <Crown className="h-3 w-3 mr-1" />
                        )}
                        {story.accessLevel}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      by {story.author} • {story.category} •{" "}
                      {story.viewCount.toLocaleString()} views
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublished(story.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {story.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(story)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(story.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{story.excerpt}</p>
                <div className="flex flex-wrap gap-1">
                  {story.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  )))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStories.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stories found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria
            </p>
          </div>
        )}

        {/* Edit Dialog */}
        {isEditing && selectedStory && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Story</DialogTitle>
                <DialogDescription>
                  Update story details and content
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editForm.title || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Author</Label>
                    <Input
                      value={editForm.author || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, author: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Excerpt</Label>
                  <Textarea
                    value={editForm.excerpt || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, excerpt: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={editForm.content || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, content: e.target.value })
                    }
                    className="min-h-32"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={editForm.category || ""}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Romance">Romance</SelectItem>
                        <SelectItem value="Thriller">Thriller</SelectItem>
                        <SelectItem value="Contemporary">Contemporary</SelectItem>
                        <SelectItem value="Fantasy">Fantasy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Access Level</Label>
                    <Select
                      value={editForm.accessLevel || ""}
                      onValueChange={(value: "free" | "premium") =>
                        setEditForm({ ...editForm, accessLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}