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
  Heart,
  Users,
  Star,
  Shield,
  BookOpen,
  Quote,
} from "lucide-react";

interface AboutProps {
  onBack: () => void;
}

export default function About({ onBack }: AboutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F9a930541b2654097be9377fff1612aa0%2F6532a2d2c5444a69b0f8c5b4757e7b05?format=webp&width=800"
                alt="Rude Gyal Confessions Logo"
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                About Rude Gyal Confessions
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to Rude Gyal Confessions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A bold platform where authentic voices share their untold stories,
              intimate confessions, and real experiences without judgment.
            </p>
          </div>

          {/* Mission Statement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">
                Rude Gyal Confessions exists to create a safe space for people
                to share their most authentic stories. We believe that everyone
                has experiences worth sharing, and that raw honesty creates
                deeper human connections. Our platform celebrates boldness,
                authenticity, and the courage it takes to be vulnerable.
              </p>
            </CardContent>
          </Card>

          {/* Values */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-green-500" />
                  Safe Space
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  We maintain a judgment-free environment where everyone can
                  share their truth safely and confidentially.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Quote className="h-5 w-5 text-blue-500" />
                  Authenticity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Real stories from real people. We celebrate genuine
                  experiences and honest storytelling above all else.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-purple-500" />
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Building connections through shared experiences and supporting
                  each other's journeys.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* What We Offer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                What We Offer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="bg-free-badge">
                    Free Stories
                  </Badge>
                  <p className="text-sm">
                    Access to our curated collection of free confessions and
                    stories from community members.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge variant="default" className="bg-premium">
                    Premium Content
                  </Badge>
                  <p className="text-sm">
                    Exclusive, in-depth stories and confessions available to
                    premium members with enhanced features.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border/50">
                <h4 className="font-semibold mb-2">Platform Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Anonymous and named story sharing options</li>
                  <li>Community interaction through comments and ratings</li>
                  <li>Content categories and tagging system</li>
                  <li>Age verification for mature content</li>
                  <li>Mobile-responsive reading experience</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Community Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Community Guidelines</CardTitle>
              <CardDescription>
                Our commitment to maintaining a respectful and safe environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p>
                    <strong>Respect & Consent:</strong> All stories shared must
                    respect the consent and privacy of others involved.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p>
                    <strong>No Judgment:</strong> We maintain a zero-tolerance
                    policy for shaming, harassment, or discriminatory behavior.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p>
                    <strong>Age Appropriate:</strong> All users must be 18+ and
                    content is clearly marked for adult audiences.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p>
                    <strong>Authenticity:</strong> We encourage genuine
                    experiences while respecting the need for anonymity and
                    privacy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle>Join Our Community</CardTitle>
              <CardDescription>
                Ready to share your story or explore others' experiences?
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                Connect with us and become part of the Rude Gyal Confessions
                community.
              </p>
              <Button
                onClick={onBack}
                className="bg-primary hover:bg-primary/90"
              >
                Explore Stories
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Rudegyalconfessions.com - All rights
              reserved
            </p>
            <p className="mt-1">Authentic confessions and intimate stories</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
