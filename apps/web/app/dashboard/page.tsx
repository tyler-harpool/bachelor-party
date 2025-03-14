"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import ProtectedRoute from "../../components/protected-route";

export default function DashboardPage() {
  const { user, authFetch } = useAuth();
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Example of using authFetch to get data from a protected endpoint
  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Using authFetch which automatically adds auth headers and handles session expiry
      const response = await authFetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setApiData(data.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Welcome, {user?.firstName}!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-700 mb-2">Your Profile</h3>
                {user && (
                  <dl className="space-y-1">
                    <dt className="text-sm text-gray-500">Name</dt>
                    <dd className="font-medium">{user.firstName} {user.lastName}</dd>
                    <dt className="text-sm text-gray-500 mt-2">Email</dt>
                    <dd className="font-medium">{user.email}</dd>
                  </dl>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-700 mb-2">API Test</h3>
                <button
                  onClick={fetchUserData}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-3"
                >
                  {loading ? "Loading..." : "Test Protected API Call"}
                </button>
                
                {apiData && (
                  <div className="text-sm bg-gray-100 p-3 rounded overflow-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(apiData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Explore the protected API routes</li>
              <li>Add more features to your Bachelor Party App</li>
              <li>Invite your friends to join</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}