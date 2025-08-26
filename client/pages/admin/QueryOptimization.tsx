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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
  Download,
  Play,
  BarChart3,
} from "lucide-react";

interface QueryOptimizationProps {
  onNavigateBack?: () => void;
}

export default function QueryOptimization({
  onNavigateBack,
}: QueryOptimizationProps) {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [optimizedQueries, setOptimizedQueries] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadAnalysisData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔍 Loading EXPLAIN analysis data...");
      const response = await fetch("/api/admin/run-explain-analysis");

      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data);
        console.log("✅ Analysis data loaded:", data.summary);
      } else {
        throw new Error(`Failed to load analysis: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error loading analysis:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load analysis",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptimizedQueries = async () => {
    try {
      console.log("⚡ Loading optimized queries...");
      const response = await fetch("/api/admin/optimized-statistics-queries");

      if (response.ok) {
        const data = await response.json();
        setOptimizedQueries(data);
        console.log("✅ Optimized queries loaded");
      }
    } catch (error) {
      console.error("❌ Error loading optimized queries:", error);
    }
  };

  const runIndexOptimization = async () => {
    try {
      console.log("🚀 Running index optimization...");
      const response = await fetch("/api/admin/optimize-database-indexes", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Index optimization complete:", result.summary);

        // Reload analysis after optimization
        setTimeout(() => {
          loadAnalysisData();
        }, 2000);

        return result;
      } else {
        throw new Error("Index optimization failed");
      }
    } catch (error) {
      console.error("❌ Index optimization error:", error);
      setError("Failed to optimize indexes");
    }
  };

  useEffect(() => {
    loadAnalysisData();
    loadOptimizedQueries();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "critical":
        return "text-red-500";
      case "good":
        return "text-green-500";
      case "unknown":
        return "text-gray-500";
      default:
        return "text-yellow-500";
    }
  };

  if (isLoading && !analysisData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="text-lg">
                Running database query analysis...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8" />
              Query Performance Analysis
            </h1>
            <p className="text-muted-foreground mt-2">
              Analyze and optimize database query performance for statistics
              endpoints
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={loadAnalysisData}
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh Analysis
            </Button>

            <Button
              onClick={runIndexOptimization}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Optimize Indexes
            </Button>

            {onNavigateBack && (
              <Button onClick={onNavigateBack} variant="outline">
                ← Back to Admin
              </Button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        {analysisData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Total Queries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysisData.summary.totalQueries}
                </div>
                <p className="text-xs text-muted-foreground">Analyzed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Critical Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {analysisData.summary.criticalIssues}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {analysisData.overallAnalysis?.healthScore || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Collections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysisData.summary.collectionsAnalyzed}
                </div>
                <p className="text-xs text-muted-foreground">Analyzed</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="critical">Critical Issues</TabsTrigger>
            <TabsTrigger value="collections">By Collection</TabsTrigger>
            <TabsTrigger value="optimized">Optimized Queries</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {analysisData?.overallAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Queries</span>
                        <Badge variant="outline">
                          {analysisData.overallAnalysis.totalQueries}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Queries with Issues</span>
                        <Badge variant="secondary">
                          {analysisData.overallAnalysis.queriesWithIssues}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Critical Queries</span>
                        <Badge variant="destructive">
                          {analysisData.overallAnalysis.criticalQueries}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Health Score</span>
                        <Badge
                          variant={
                            analysisData.overallAnalysis.healthScore > 80
                              ? "default"
                              : "destructive"
                          }
                        >
                          {analysisData.overallAnalysis.healthScore}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Collection Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Collection Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(
                        analysisData.overallAnalysis.collectionIssues || {},
                      ).map(([collection, stats]: [string, any]) => (
                        <div
                          key={collection}
                          className="flex justify-between items-center"
                        >
                          <span className="capitalize">{collection}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {stats.total} queries
                            </Badge>
                            {stats.critical > 0 && (
                              <Badge variant="destructive">
                                {stats.critical} critical
                              </Badge>
                            )}
                            {stats.issues > 0 && stats.critical === 0 && (
                              <Badge variant="secondary">
                                {stats.issues} issues
                              </Badge>
                            )}
                            {stats.issues === 0 && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Critical Issues Tab */}
          <TabsContent value="critical" className="space-y-4">
            {analysisData?.criticalIssues &&
            analysisData.criticalIssues.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                    Critical Issues Requiring Immediate Attention
                  </CardTitle>
                  <CardDescription>
                    These queries are performing full collection scans or have
                    severe performance issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.criticalIssues.map(
                      (issue: any, index: number) => (
                        <Alert key={index} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>
                            {issue.queryName} ({issue.collection})
                          </AlertTitle>
                          <AlertDescription>
                            <div className="mt-2 space-y-2">
                              <p>
                                <strong>Issue:</strong> {issue.issue.message}
                              </p>
                              <p>
                                <strong>Impact:</strong> {issue.issue.impact}
                              </p>
                              {issue.recommendations &&
                                issue.recommendations.length > 0 && (
                                  <div>
                                    <strong>Recommendations:</strong>
                                    <ul className="list-disc list-inside mt-1">
                                      {issue.recommendations.map(
                                        (rec: string, i: number) => (
                                          <li key={i} className="text-sm">
                                            {rec}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">
                    No Critical Issues Found
                  </h3>
                  <p className="text-muted-foreground">
                    All queries are performing within acceptable parameters
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-4">
            {analysisData?.explainResults && (
              <div className="space-y-6">
                {Object.entries(analysisData.explainResults).map(
                  ([collection, queries]: [string, any]) => (
                    <Card key={collection}>
                      <CardHeader>
                        <CardTitle className="capitalize">
                          {collection} Collection
                        </CardTitle>
                        <CardDescription>
                          Query performance analysis for {collection} collection
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {queries.error ? (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Analysis Error</AlertTitle>
                            <AlertDescription>{queries.error}</AlertDescription>
                          </Alert>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Query</TableHead>
                                <TableHead>Performance</TableHead>
                                <TableHead>Docs Examined</TableHead>
                                <TableHead>Docs Returned</TableHead>
                                <TableHead>Issues</TableHead>
                                <TableHead>Indexes Used</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.values(queries).map(
                                (query: any, index: number) =>
                                  query.queryName && (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">
                                        {query.queryName}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            query.performance === "good"
                                              ? "default"
                                              : query.performance === "critical"
                                                ? "destructive"
                                                : "secondary"
                                          }
                                          className={`${getPerformanceColor(query.performance)}`}
                                        >
                                          {query.performance}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {query.executionStats
                                          ?.totalDocsExamined || 0}
                                      </TableCell>
                                      <TableCell>
                                        {query.executionStats
                                          ?.totalDocsReturned || 0}
                                      </TableCell>
                                      <TableCell>
                                        {query.issues?.length > 0 ? (
                                          <div className="flex flex-col gap-1">
                                            {query.issues.map(
                                              (issue: any, i: number) => (
                                                <Badge
                                                  key={i}
                                                  variant="outline"
                                                  className={`${getSeverityColor(issue.severity)} text-white`}
                                                >
                                                  {issue.type}
                                                </Badge>
                                              ),
                                            )}
                                          </div>
                                        ) : (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {query.indexesUsed?.length > 0 ? (
                                          query.indexesUsed.map(
                                            (index: string, i: number) => (
                                              <Badge
                                                key={i}
                                                variant="outline"
                                                className="mr-1"
                                              >
                                                {index}
                                              </Badge>
                                            ),
                                          )
                                        ) : (
                                          <span className="text-muted-foreground">
                                            None
                                          </span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ),
                              )}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            )}
          </TabsContent>

          {/* Optimized Queries Tab */}
          <TabsContent value="optimized" className="space-y-4">
            {optimizedQueries?.optimizedQueries && (
              <div className="space-y-6">
                {optimizedQueries.optimizedQueries.map(
                  (query: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          {query.name}
                        </CardTitle>
                        <CardDescription>{query.problem}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">
                              Original Query
                            </h4>
                            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                              {query.originalQuery}
                            </pre>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">
                              Optimized Query
                            </h4>
                            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                              {query.optimizedQuery}
                            </pre>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <strong>Required Index:</strong>
                            <Badge variant="outline" className="ml-2">
                              {query.requiredIndex}
                            </Badge>
                          </div>
                          <div>
                            <strong>Expected Gain:</strong>
                            <Badge variant="default" className="ml-2">
                              {query.performanceGain}
                            </Badge>
                          </div>
                          <div>
                            <strong>Category:</strong>
                            <Badge variant="secondary" className="ml-2">
                              {query.category}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-3">
                          <strong>Explanation:</strong>
                          <p className="text-sm text-muted-foreground mt-1">
                            {query.explanation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {analysisData?.recommendations && (
              <div className="space-y-4">
                {analysisData.recommendations.map((rec: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {rec.type === "index" ? "Create Index" : "Optimization"}
                      </CardTitle>
                      <CardDescription>
                        Priority:{" "}
                        <Badge
                          variant={
                            rec.priority === "critical"
                              ? "destructive"
                              : rec.priority === "high"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {rec.priority}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <strong>Collection:</strong>{" "}
                          <code>{rec.collection}</code>
                        </div>
                        {rec.index && (
                          <div>
                            <strong>Index:</strong>{" "}
                            <code className="bg-muted px-2 py-1 rounded">
                              {rec.index}
                            </code>
                          </div>
                        )}
                        <div>
                          <strong>Reason:</strong> {rec.reason}
                        </div>
                        <div>
                          <strong>Affected Queries:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rec.queries.map((query: string, i: number) => (
                              <Badge key={i} variant="outline">
                                {query}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Next Steps */}
        {analysisData?.nextSteps && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Next Steps
              </CardTitle>
              <CardDescription>
                Recommended actions to improve query performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisData.nextSteps.map((step: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded"
                  >
                    <Badge variant="outline" className="mt-0.5">
                      Step {step.step}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold">{step.action}</h4>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                      {step.command && (
                        <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                          {step.command}
                        </code>
                      )}
                    </div>
                    <Badge
                      variant={
                        step.priority === "immediate"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {step.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
