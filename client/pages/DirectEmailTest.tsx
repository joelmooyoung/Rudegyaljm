import React, { useState } from "react";

export default function DirectEmailTest() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const sendTestEmail = async () => {
    if (!email) {
      setResult({ message: "Please enter an email address", type: "error" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          message: `✅ Test email sent successfully to ${email}! Check your inbox (and spam folder). Email ID: ${data.emailId}`,
          type: "success"
        });
      } else {
        setResult({
          message: `❌ Failed to send email: ${data.message || "Unknown error"}`,
          type: "error"
        });
      }
    } catch (error) {
      setResult({
        message: `❌ Network error: ${error.message}`,
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Test (No Auth Required)
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Test Resend email integration directly
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Test Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="your-email@example.com"
            />
          </div>

          {result && (
            <div className={`text-sm p-3 rounded-md ${
              result.type === "success" 
                ? "text-green-800 bg-green-100 border border-green-200" 
                : "text-red-800 bg-red-100 border border-red-200"
            }`}>
              {result.message}
            </div>
          )}

          <div>
            <button
              onClick={sendTestEmail}
              disabled={isLoading || !email.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                "Send Test Email"
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Debug Info</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• This page bypasses authentication</li>
              <li>• Tests Resend email integration directly</li>
              <li>• Check browser console for detailed logs</li>
              <li>• Check spam folder if email doesn't arrive</li>
            </ul>
          </div>

          <div className="text-center">
            <a
              href="/"
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
