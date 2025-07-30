import React, { useState } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface FinalAuthProps {
  onAuthenticated: (user: User) => void;
}

export default function FinalAuth({ onAuthenticated }: FinalAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hardcoded accounts - no API needed
  const accounts = {
    'admin@nocturne.com': {
      password: 'admin123',
      user: {
        id: 'admin-001',
        email: 'admin@nocturne.com',
        username: 'admin',
        role: 'admin'
      }
    },
    'joelmooyoung@me.com': {
      password: 'password123',
      user: {
        id: 'joel-001',
        email: 'joelmooyoung@me.com', 
        username: 'joelmooyoung',
        role: 'admin'
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500));

    const account = accounts[email.toLowerCase() as keyof typeof accounts];
    
    if (!account || account.password !== password) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    // Success - store token and authenticate
    localStorage.setItem('authToken', `token_${account.user.id}_${Date.now()}`);
    onAuthenticated(account.user);
    setLoading(false);
  };

  const useTestAccount = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hardcoded authentication - no database required
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Test accounts */}
          <div className="border-t pt-4">
            <p className="text-center text-sm text-gray-600 mb-2">Test Accounts (Click to fill):</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => useTestAccount('admin@nocturne.com', 'admin123')}
                className="w-full text-sm py-2 px-3 bg-blue-100 hover:bg-blue-200 rounded border"
              >
                👑 Admin Account
              </button>
              <button
                type="button"
                onClick={() => useTestAccount('joelmooyoung@me.com', 'password123')}
                className="w-full text-sm py-2 px-3 bg-green-100 hover:bg-green-200 rounded border"
              >
                📧 Joel's Account
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Authentication works entirely in frontend - no server calls
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
