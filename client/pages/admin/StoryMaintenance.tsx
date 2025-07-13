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

interface StoryMaintenanceProps {
  onBack: () => void;
  onEditStory: (story: Story | null, mode: "add" | "edit") => void;
}

export default function StoryMaintenance({
  onBack,
  onEditStory,
}: StoryMaintenanceProps) {
  const [searchTerm, setSearchTerm] = useState("");

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
            <Button onClick={() => onEditStory(null, "add")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Story
            </Button>
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

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>Story Management</CardTitle>
            <CardDescription>
              Add, edit, and manage stories on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Story Management</h3>
              <p className="text-muted-foreground mb-4">
                Administrators can add, edit, delete, and manage story
                publication status
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    onEditStory(
                      {
                        id: "sample1",
                        title: "Sample Story",
                        excerpt: "A sample story for demonstration",
                        content:
                          "<p>This is sample content with <strong>HTML formatting</strong>.</p>",
                        author: "Sample Author",
                        category: "Romance",
                        tags: ["sample", "demo"],
                        accessLevel: "free" as const,
                        isPublished: false,
                        rating: 4.5,
                        ratingCount: 10,
                        viewCount: 100,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                      "edit",
                    )
                  }
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Sample Story
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Manage Publishing
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Stories
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
