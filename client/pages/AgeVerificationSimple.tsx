import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Heart, Eye } from "lucide-react";

interface AgeVerificationProps {
  onVerified: () => void;
}

export default function AgeVerificationSimple({
  onVerified,
}: AgeVerificationProps) {
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");

  const handleVerification = () => {
    if (!birthDate) {
      setError("Please enter your date of birth");
      return;
    }

    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      setError("You must be 18 or older to access this content");
      return;
    }

    setError("");
    onVerified();
  };

  const handleExit = () => {
    window.location.href = "https://google.com";
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-400 mb-4">
            Rude Gyal ConfessionsXXX
          </h1>
          <p className="text-xl text-gray-300">
            Adult Content - Age Verification Required
          </p>
        </div>

        <Card className="bg-slate-800 border-red-500/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-400 mb-3">
              Enter the Forbidden Realm
            </CardTitle>
            <CardDescription className="text-gray-300">
              You must be <strong className="text-red-400">18 or older</strong>{" "}
              to access this content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="birthdate"
                className="text-gray-200 flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Date of Birth
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="bg-slate-700 border-gray-600 text-white"
              />
            </div>

            {error && (
              <div className="text-red-400 bg-red-900/20 p-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleVerification}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
              >
                <Heart className="h-4 w-4 mr-2" />I am 18+ - Enter
              </Button>

              <Button
                variant="outline"
                onClick={handleExit}
                className="w-full border-gray-600 text-gray-300 hover:bg-slate-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Exit
              </Button>
            </div>

            <div className="text-xs text-gray-400 text-center space-y-1">
              <p>By entering, you confirm you are of legal age.</p>
              <p>We do not store personal information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
