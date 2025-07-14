import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ChevronDown,
  Search,
  HelpCircle,
  Shield,
  Crown,
  Settings,
  Mail,
  Book,
  Users,
} from "lucide-react";
import { useState } from "react";

interface HelpProps {
  onBack: () => void;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    question: "How do I create an account?",
    answer:
      "Click on the 'Register' tab on the login page, provide a valid email, username, date of birth (you must be 18+), and create a password. You'll need to verify your age before accessing the platform.",
    category: "Account",
  },
  {
    question: "What's the difference between free and premium accounts?",
    answer:
      "Free accounts can access our curated collection of free stories and confessions. Premium accounts get access to exclusive content, premium stories, enhanced features, and can interact more deeply with the community.",
    category: "Account",
  },
  {
    question: "How do I upgrade to premium?",
    answer:
      "Premium subscriptions are available for users who want access to exclusive content. Contact our support team for subscription options and pricing details.",
    category: "Account",
  },
  {
    question: "How do I submit my own story or confession?",
    answer:
      "Currently, story submission is managed by our content team. If you'd like to share your story, please contact us through our contact form with details about your confession or experience.",
    category: "Content",
  },
  {
    question: "Are stories anonymous?",
    answer:
      "Stories can be published anonymously or with attribution, depending on the author's preference. We respect privacy and confidentiality for all our contributors.",
    category: "Content",
  },
  {
    question: "What type of content is allowed?",
    answer:
      "We welcome authentic stories and confessions about real experiences. Content must be respectful, consensual, and appropriate for our 18+ audience. We have strict guidelines against harassment, non-consensual content, or illegal activities.",
    category: "Content",
  },
  {
    question: "How do you verify age?",
    answer:
      "All users must confirm they are 18 years or older during the registration process. This is required by law for adult content platforms and helps ensure our community remains age-appropriate.",
    category: "Safety",
  },
  {
    question: "Is my personal information safe?",
    answer:
      "Yes, we take privacy seriously. We use industry-standard security measures to protect your data. We never share personal information with third parties without your consent.",
    category: "Safety",
  },
  {
    question: "How do I report inappropriate content?",
    answer:
      "If you encounter content that violates our community guidelines, please contact our support team immediately. We review all reports and take appropriate action to maintain a safe environment.",
    category: "Safety",
  },
  {
    question: "Can I delete my account?",
    answer:
      "Yes, you can request account deletion by contacting our support team. We'll remove your personal information in accordance with our privacy policy.",
    category: "Account",
  },
  {
    question: "Why can't I access certain stories?",
    answer:
      "Some stories are premium-only content available to subscribers. Others might be restricted based on content warnings or community guidelines. Make sure you're logged in and have the appropriate access level.",
    category: "Content",
  },
  {
    question: "How do I contact support?",
    answer:
      "You can reach our support team through the contact form on our Contact page, or email us directly at support@rudegyaljm.com. We typically respond within 24 hours.",
    category: "Support",
  },
];

export default function Help({ onBack }: HelpProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

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
                Help Center
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
              How Can We Help?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to frequently asked questions and get the help you
              need.
            </p>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Search FAQ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for help topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Help Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Account Help</CardTitle>
                <CardDescription>
                  Registration, login, and account management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Book className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Content & Stories</CardTitle>
                <CardDescription>
                  Submission guidelines and content policies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Safety & Privacy</CardTitle>
                <CardDescription>
                  Security, privacy, and community guidelines
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                {filteredFAQs.length} question(s) found
                {searchTerm && ` for "${searchTerm}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <Collapsible
                    key={index}
                    open={openItems.has(index)}
                    onOpenChange={() => toggleItem(index)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-left p-4 h-auto hover:bg-accent/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {faq.category === "Account" && (
                                  <Settings className="h-3 w-3" />
                                )}
                                {faq.category === "Content" && (
                                  <Book className="h-3 w-3" />
                                )}
                                {faq.category === "Safety" && (
                                  <Shield className="h-3 w-3" />
                                )}
                                {faq.category === "Support" && (
                                  <Mail className="h-3 w-3" />
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {faq.question}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {faq.category}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            openItems.has(index) ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2">
                        <div className="pl-9">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No questions found matching "{searchTerm}"
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle>Still Need Help?</CardTitle>
              <CardDescription>
                Can't find what you're looking for? Our support team is here to
                help.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => alert("Contact page coming soon!")}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open("mailto:support@rudegyaljm.com")}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Us Directly
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Average response time: 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Rudegyaljm.com - All rights reserved
            </p>
            <p className="mt-1">Authentic confessions and intimate stories</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
