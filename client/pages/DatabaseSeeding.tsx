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
import {
  Database,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react";

interface SeedResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default function DatabaseSeeding() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);

  const seedDatabase = async () => {
    setIsSeeding(true);
    setResult(null);

    try {
      console.log("🌱 Starting database seeding...");

      const response = await fetch("/api/seed-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Seed response:", data);

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: "Database seeded successfully!",
          data: data,
        });
      } else {
        setResult({
          success: false,
          message: "Seeding failed",
          error: data.message || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Seed error:", error);
      setResult({
        success: false,
        message: "Network error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const verifyDatabase = async () => {
    setIsVerifying(true);
    setResult(null);

    try {
      console.log("🔍 Verifying database...");

      const response = await fetch("/api/verify-database");
      const data = await response.json();
      console.log("Verify response:", data);

      if (response.ok) {
        setResult({
          success: true,
          message: "Database verification complete",
          data: data,
        });
      } else {
        setResult({
          success: false,
          message: "Verification failed",
          error: data.message || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Verify error:", error);
      setResult({
        success: false,
        message: "Network error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const clearDatabase = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all database data? This cannot be undone.",
      )
    ) {
      return;
    }

    setIsClearing(true);
    setResult(null);

    try {
      console.log("🗑️ Clearing database...");

      const response = await fetch("/api/clear-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Clear response:", data);

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: "Database cleared successfully",
          data: data,
        });
      } else {
        setResult({
          success: false,
          message: "Clear failed",
          error: data.message || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Clear error:", error);
      setResult({
        success: false,
        message: "Network error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Database className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">
              Database Seeding
            </CardTitle>
            <CardDescription className="text-lg">
              Rude Gyal Confessions - Development Environment
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">📊 What Gets Created</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">4 Users</Badge>
                  <span className="text-sm">
                    Admin, Premium, Free, Inactive
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">5 Stories</Badge>
                  <span className="text-sm">
                    Romance & Fantasy with rich content
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">5 Comments</Badge>
                  <span className="text-sm">Across different stories</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">3 Logs</Badge>
                  <span className="text-sm">Login tracking with IP data</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">🔐 Test Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-mono text-sm">
                    <div>
                      <strong>Admin:</strong> admin@nocturne.com
                    </div>
                    <div>
                      <strong>Password:</strong> admin123
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-mono text-sm">
                    <div>
                      <strong>Premium:</strong> premium@test.com
                    </div>
                    <div>
                      <strong>Password:</strong> premium123
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-mono text-sm">
                    <div>
                      <strong>Free:</strong> free@test.com
                    </div>
                    <div>
                      <strong>Password:</strong> free123
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🚀 Database Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={seedDatabase}
                disabled={isSeeding}
                size="lg"
                className="flex items-center gap-2"
              >
                {isSeeding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isSeeding ? "Seeding..." : "🌱 Seed Database"}
              </Button>

              <Button
                onClick={verifyDatabase}
                disabled={isVerifying}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {isVerifying ? "Verifying..." : "🔍 Verify Database"}
              </Button>

              <Button
                onClick={clearDatabase}
                disabled={isClearing}
                variant="destructive"
                size="lg"
                className="flex items-center gap-2"
              >
                {isClearing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isClearing ? "Clearing..." : "🗑️ Clear Database"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {result.success ? "Success" : "Error"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-lg font-medium">{result.message}</p>

                {result.error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive font-mono text-sm">
                      {result.error}
                    </p>
                  </div>
                )}

                {result.data && (
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="text-sm overflow-auto max-h-96">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Click <strong>"🌱 Seed Database"</strong> to create test data
              </li>
              <li>Wait for the success message</li>
              <li>
                Navigate back to the main app (remove{" "}
                <code>/admin/seeding</code> from URL)
              </li>
              <li>
                Try logging in with <code>admin@nocturne.com</code> /{" "}
                <code>admin123</code>
              </li>
              <li>Explore the stories, user management, and admin features</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
