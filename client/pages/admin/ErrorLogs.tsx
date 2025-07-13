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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Search,
  ArrowLeft,
  Trash2,
  RefreshCw,
  AlertCircle,
  XCircle,
  Zap,
} from "lucide-react";
import { ErrorLog } from "@shared/api";

interface ErrorLogsProps {
  onBack: () => void;
}

export default function ErrorLogs({ onBack }: ErrorLogsProps) {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/error-logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch error logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    if (confirm("Are you sure you want to clear all error logs?")) {
      try {
        const response = await fetch("/api/admin/clear-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "error" }),
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

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.error.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userId && log.userId.includes(searchTerm));

    const matchesSeverity =
      severityFilter === "all" || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Zap className="h-3 w-3" />;
      case "high":
        return <XCircle className="h-3 w-3" />;
      case "medium":
        return <AlertTriangle className="h-3 w-3" />;
      case "low":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
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
              <AlertTriangle className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Error Logs</h1>
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
        {/* Search and Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search errors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Errors</CardTitle>
            <CardDescription>
              Monitor application errors and system issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge
                          variant={getSeverityVariant(log.severity)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getSeverityIcon(log.severity)}
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-64">
                        <div className="text-sm font-medium truncate">
                          {log.error}
                        </div>
                        {log.stack && (
                          <div className="text-xs text-muted-foreground truncate">
                            {log.stack.split("\n")[0]}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.endpoint}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.userId || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No error logs</h3>
                <p className="text-muted-foreground">
                  {isLoading ? "Loading error logs..." : "No errors found"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
