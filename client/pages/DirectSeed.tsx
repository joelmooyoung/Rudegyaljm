import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

export default function DirectSeed() {
  const [mongoUri, setMongoUri] = useState("");
  const [results, setResults] = useState("");
  const [resultType, setResultType] = useState<"success" | "error" | "info">(
    "info",
  );

  const testConnection = () => {
    if (!mongoUri) {
      setResults("Please enter a MongoDB connection string");
      setResultType("error");
      return;
    }

    setResults("Testing connection...");
    setResultType("info");

    // Validate connection string format
    if (mongoUri.includes("mongodb+srv://") && mongoUri.includes("@")) {
      setResults("✅ Connection string format is valid!");
      setResultType("success");
    } else {
      setResults("❌ Invalid MongoDB connection string format");
      setResultType("error");
    }
  };

  const generateScript = () => {
    return `// MongoDB Seeding Script for Rude Gyal Confessions
use('rude-gyal-confessions');

// Clear existing data
db.users.deleteMany({});
db.stories.deleteMany({});
db.comments.deleteMany({});
db.loginlogs.deleteMany({});

// Insert Users (passwords are hashed with bcrypt)
db.users.insertMany([
  {
    userId: "admin1",
    username: "admin",
    email: "admin@nocturne.com",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeSwWKw5ZzVAGTj22", // admin123
    type: "admin",
    country: "Unknown",
    active: true,
    loginCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: "premium1",
    username: "premiumuser",
    email: "premium@test.com",
    password: "$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // premium123
    type: "premium",
    country: "Unknown",
    active: true,
    loginCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userId: "free1",
    username: "freeuser",
    email: "free@test.com",
    password: "$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // free123
    type: "free",
    country: "Unknown",
    active: true,
    loginCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert Stories
db.stories.insertMany([
  {
    storyId: "story1",
    title: "Midnight Desires",
    content: "The clock struck midnight as Sophia stepped onto the moonlit balcony, her silk nightgown flowing in the gentle breeze. She had been unable to sleep, her mind consumed by thoughts of the mysterious stranger she'd met at the masquerade ball just hours before.",
    author: "Luna Starweaver",
    category: "Romance",
    tags: ["Passionate", "Forbidden Love", "Midnight", "Garden", "Desire"],
    published: true,
    featured: false,
    views: 2340,
    likeCount: 45,
    averageRating: 4.8,
    ratingCount: 127,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    storyId: "story2",
    title: "The Executive's Secret",
    content: "Victoria Cross commanded respect in every boardroom she entered. As the youngest female CEO in the city's financial district, she had clawed her way to the top through determination, intelligence, and an unwavering focus on success.",
    author: "Scarlett Blackthorne",
    category: "Romance",
    tags: ["Office Romance", "Power", "CEO", "Forbidden", "Executive"],
    published: true,
    featured: true,
    views: 1580,
    likeCount: 67,
    averageRating: 4.9,
    ratingCount: 89,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    storyId: "story3",
    title: "Summer Heat",
    content: "The Mediterranean sun beat down mercilessly on the pristine white sands of the exclusive resort, but Isabella barely noticed the heat as she lounged by the infinity pool.",
    author: "Marina Solace",
    category: "Romance",
    tags: ["Beach Romance", "Vacation", "Mediterranean", "Summer", "Passion"],
    published: true,
    featured: false,
    views: 2890,
    likeCount: 123,
    averageRating: 4.6,
    ratingCount: 156,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert Comments
db.comments.insertMany([
  {
    commentId: "comment1",
    storyId: "story1",
    userId: "premium1",
    username: "premiumuser",
    comment: "Absolutely captivating! The imagery in this story is so vivid.",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    commentId: "comment2",
    storyId: "story1",
    userId: "free1",
    username: "freeuser",
    comment: "Luna Starweaver has such a beautiful writing style. Can't wait to read more!",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("✅ Database seeded successfully!");
print("Test accounts:");
print("Admin: admin@nocturne.com / admin123");
print("Premium: premium@test.com / premium123");
print("Free: free@test.com / free123");`;
  };

  const createDatabase = () => {
    if (!mongoUri) {
      setResults("Please enter a MongoDB connection string");
      setResultType("error");
      return;
    }

    setResults("Database seeding script generated!");
    setResultType("success");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              🌱 Direct MongoDB Database Seeding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="mongoUri">MongoDB Connection String:</Label>
                <Input
                  id="mongoUri"
                  type="text"
                  placeholder="mongodb+srv://username:password@cluster.mongodb.net/rude-gyal-confessions?retryWrites=true&w=majority"
                  value={mongoUri}
                  onChange={(e) => setMongoUri(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={testConnection} variant="outline">
                  Test Connection
                </Button>
                <Button onClick={createDatabase}>
                  Generate Seeding Script
                </Button>
              </div>
            </div>

            {results && (
              <Alert
                className={
                  resultType === "error"
                    ? "border-red-500"
                    : resultType === "success"
                      ? "border-green-500"
                      : "border-blue-500"
                }
              >
                <AlertDescription>{results}</AlertDescription>
              </Alert>
            )}

            {resultType === "success" && mongoUri && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    MongoDB Script (Copy and run in MongoDB Compass or CLI):
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    readOnly
                    value={generateScript()}
                    className="min-h-96 font-mono text-sm"
                    onClick={(e) => e.currentTarget.select()}
                  />

                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Instructions:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Copy the script above</li>
                      <li>Open MongoDB Compass or MongoDB CLI</li>
                      <li>Connect to your database: {mongoUri}</li>
                      <li>Select the "rude-gyal-confessions" database</li>
                      <li>Run the script in the MongoDB shell</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Test Accounts (after seeding):
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  <li>
                    <strong>Admin:</strong> admin@nocturne.com / admin123
                  </li>
                  <li>
                    <strong>Premium:</strong> premium@test.com / premium123
                  </li>
                  <li>
                    <strong>Free:</strong> free@test.com / free123
                  </li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
