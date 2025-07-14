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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Search,
  ArrowLeft,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Mail,
  Globe,
  Monitor,
} from "lucide-react";
import { LoginLog } from "@shared/api";

interface LoginLogsProps {
  onBack: () => void;
}

export default function LoginLogs({ onBack }: LoginLogsProps) {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/login-logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch login logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    if (confirm("Are you sure you want to clear all login logs?")) {
      try {
        const response = await fetch("/api/admin/clear-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "login" }),
        });
        if (response.ok) {
          setLogs([]);
        }
      } catch (error) {
        console.error("Failed to clear logs:", error);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm) ||
      log.country.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-display font-bold text-passion-gradient">
                Login Logs
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchLogs}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="destructive" onClick={clearLogs}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Logs
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user ID, email, IP, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 seductive-border font-serif"
            />
          </div>
        </div>

        {/* Logs Table */}
        <Card className="story-card-intimate seductive-border">
          <CardHeader>
            <CardTitle className="text-xl font-display font-bold text-passion-gradient">
              Successful Login Activity
            </CardTitle>
            <CardDescription className="font-serif">
              Monitor successful user logins with detailed tracking information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-serif">User ID</TableHead>
                    <TableHead className="font-serif">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email
                    </TableHead>
                    <TableHead className="font-serif">
                      <Monitor className="inline h-4 w-4 mr-1" />
                      IP Address
                    </TableHead>
                    <TableHead className="font-serif">
                      <Globe className="inline h-4 w-4 mr-1" />
                      Country
                    </TableHead>
                    <TableHead className="font-serif">User Agent</TableHead>
                    <TableHead className="font-serif">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-card/50">
                      <TableCell className="font-mono text-sm font-serif">
                        {log.userId}
                      </TableCell>
                      <TableCell className="font-serif">{log.email}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="font-serif">
                        <Badge
                          variant="outline"
                          className="bg-seductive-gradient text-primary-foreground"
                        >
                          {log.country}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-sm text-muted-foreground font-serif">
                        {log.userAgent}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-serif">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 sultry-pulse" />
                <h3 className="text-lg font-display font-semibold mb-2 text-passion-gradient">
                  No login logs
                </h3>
                <p className="text-muted-foreground font-serif">
                  {isLoading
                    ? "Loading passionate login activity..."
                    : "No successful login activity found"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
