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
import {
  ArrowLeft,
  RefreshCw,
  Database,
  Clock,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Star,
  AlertCircle,
  CheckCircle,
  Activity
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StatsManagementProps {
  onBack: () => void;
}

interface StatsCache {
  lastUpdate?: string;
  totalStories?: number;
  totalViews?: number;
  totalLikes?: number;
  totalComments?: number;
  totalRatings?: number;
  averageRating?: number;
  calculationTimeMs?: number;
}

export default function StatsManagement({ onBack }: StatsManagementProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculation, setLastCalculation] = useState<StatsCache | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [calculationHistory, setCalculationHistory] = useState<any[]>([]);

  // Load current stats cache info
  useEffect(() => {
    loadStatsInfo();
  }, []);

  const loadStatsInfo = async () => {
    try {
      // You could create a separate API to get stats cache info
      console.log("Loading current stats cache information...");
      // For now, we'll show a placeholder
    } catch (error) {
      console.error("Failed to load stats info:", error);
    }
  };

  const calculateAllStats = async () => {
    setIsCalculating(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("🚀 Starting batch stats calculation...");
      
      const response = await fetch('/api/admin/calculate-all-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Stats calculation completed:", result);
        
        setLastCalculation({
          lastUpdate: result.timestamp,
          totalStories: result.summary.totalStories,
          totalViews: result.summary.totalViews,
          totalLikes: result.summary.totalLikes,
          totalComments: result.summary.totalComments,
          totalRatings: result.summary.totalRatings,
          averageRating: result.summary.averageRating,
          calculationTimeMs: result.timing.totalTimeMs
        });

        setSuccess(`Stats updated successfully! Processed ${result.timing.storiesProcessed} stories in ${result.timing.totalTimeMs}ms. Updated ${result.results.updated} entries, created ${result.results.created} new entries.`);
        
        // Add to history
        setCalculationHistory(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
        
      } else {
        const errorData = await response.json();
        setError(`Failed to calculate stats: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Stats calculation error:", error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Stats Management
            </h1>
            <p className="text-muted-foreground">
              Manage and refresh cached statistics for optimal performance
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert className="mb-6 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Actions */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Calculate Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recalculate All Stats
              </CardTitle>
              <CardDescription>
                Perform a full recalculation of all story statistics. This will update views, likes, comments, and ratings for all stories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={calculateAllStats} 
                disabled={isCalculating}
                className="w-full"
                size="lg"
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Calculating Stats...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Calculate All Stats
                  </>
                )}
              </Button>
              
              {isCalculating && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Activity className="h-4 w-4 animate-pulse" />
                    <span className="text-sm">Processing all stories and calculating statistics...</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    This may take a few moments depending on the number of stories.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Benefits
              </CardTitle>
              <CardDescription>
                Cached stats dramatically improve page load times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Single database query per page</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>No real-time aggregations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Faster pagination and sorting</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Reduced database load</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Stats Summary */}
        {lastCalculation && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Latest Stats Summary
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(lastCalculation.lastUpdate || '').toLocaleString()}
                {lastCalculation.calculationTimeMs && (
                  <span className="ml-2">
                    • Calculated in {formatDuration(lastCalculation.calculationTimeMs)}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {lastCalculation.totalStories || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Stories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                    <Eye className="h-4 w-4" />
                    {formatNumber(lastCalculation.totalViews || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                    <Heart className="h-4 w-4" />
                    {formatNumber(lastCalculation.totalLikes || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {formatNumber(lastCalculation.totalComments || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                    <Star className="h-4 w-4" />
                    {formatNumber(lastCalculation.totalRatings || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Ratings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {lastCalculation.averageRating?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calculation History */}
        {calculationHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Calculations
              </CardTitle>
              <CardDescription>
                History of recent stats calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calculationHistory.map((calc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">
                        {new Date(calc.timestamp).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {calc.timing.storiesProcessed} stories • {formatDuration(calc.timing.totalTimeMs)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        Updated: {calc.results.updated}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Created: {calc.results.created}
                      </Badge>
                    </div>
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
