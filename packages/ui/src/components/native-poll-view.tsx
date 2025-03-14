import { useState, useEffect } from 'react';
import { buttonVariants } from "./button";
import { cn } from "../lib/utils";

// Match the interface from the API
interface PollResult {
  id: string;
  timestamp: string;
  results: {
    option: string;
    count: number;
  }[];
  totalVotes: number;
}

// Typed API response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Simple, optimized poll view for native apps
export function NativePollView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PollResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  // Try multiple possible URLs in case there's a port or hostname issue
  const possibleApiUrls = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ];

  // Function to determine the best API URL based on environment
  const getApiUrl = () => {
    // For native Tauri apps, always use the explicit URL
    if (typeof window !== 'undefined' && !!(window as any).__TAURI__) {
      return `${possibleApiUrls[0]}/api/poll/simple`;
    }
    
    // For web app - use relative URL
    return '/api/poll/simple';
  };
  
  // For debugging purposes - log the available routes and test all possible URLs
  useEffect(() => {
    if (typeof window !== 'undefined' && !!(window as any).__TAURI__) {
      console.log('Native app detected, testing API endpoints...');
      
      // Test both the test endpoint and poll endpoint with all possible URLs
      possibleApiUrls.forEach(baseUrl => {
        // Test the simple test endpoint
        fetch(`${baseUrl}/api/test`)
          .then(res => {
            console.log(`Test endpoint (${baseUrl}) status:`, res.status);
            return res.text();
          })
          .then(text => console.log(`Test endpoint (${baseUrl}) response:`, text.substring(0, 100) + '...'))
          .catch(err => console.error(`Test endpoint (${baseUrl}) error:`, err));
          
        // Test the poll endpoint
        fetch(`${baseUrl}/api/poll/simple`)
          .then(res => {
            console.log(`Poll endpoint (${baseUrl}) status:`, res.status);
            return res.text();
          })
          .then(text => console.log(`Poll endpoint (${baseUrl}) response:`, text.substring(0, 100) + '...'))
          .catch(err => console.error(`Poll endpoint (${baseUrl}) error:`, err));
      });
    }
  }, []);

  // Function to normalize poll data from different response formats
  const normalizePollData = (data: any): PollResult => {
    console.log('Normalizing poll data:', JSON.stringify(data, null, 2));
    
    // Case 1: Already in the correct format
    if (data.id && data.timestamp && Array.isArray(data.results) && typeof data.totalVotes === 'number') {
      return data as PollResult;
    }
    
    // Case 2: API response with data property
    if (data.data && data.success) {
      return normalizePollData(data.data);
    }
    
    // Case 3: Old format with items array
    if (Array.isArray(data.items)) {
      return {
        id: 'normalized-' + Date.now(),
        timestamp: data.timestamp || new Date().toISOString(),
        results: data.items.map((item: any) => ({
          option: item.option,
          count: item.count
        })),
        totalVotes: data.items.reduce((sum: number, item: any) => sum + item.count, 0)
      };
    }
    
    // Case 4: Direct array of results
    if (Array.isArray(data)) {
      return {
        id: 'array-' + Date.now(),
        timestamp: new Date().toISOString(),
        results: data.map((item: any) => ({
          option: item.option,
          count: item.count
        })),
        totalVotes: data.reduce((sum: number, item: any) => sum + item.count, 0)
      };
    }
    
    // Fallback: Create a placeholder result
    console.warn('Could not normalize poll data, using fallback:', data);
    return {
      id: 'fallback-' + Date.now(),
      timestamp: new Date().toISOString(),
      results: [
        { option: 'Pizza', count: 4 },
        { option: 'Burgers', count: 2 },
        { option: 'Tacos', count: 2 },
        { option: 'Sushi', count: 2 }
      ],
      totalVotes: 10
    };
  };

  // Function to fetch poll data
  const fetchPollData = async () => {
    setLoading(true);
    setError(null);
    
    const isNative = typeof window !== 'undefined' && !!(window as any).__TAURI__;
    
    try {
      let responseData: any = null;
      let fetchError: Error | null = null;
      
      // For native apps, try all URLs until one works
      if (isNative) {
        for (const baseUrl of possibleApiUrls) {
          const apiUrl = `${baseUrl}/api/poll/simple`;
          try {
            console.log(`Attempting to fetch poll data from: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(5000) // Shorter timeout for fast failures
            });
            
            console.log(`Poll API response from ${baseUrl} status:`, response.status);
            
            if (response.ok) {
              const text = await response.text();
              
              // Debug: Log the raw response
              console.log(`Raw API response from ${baseUrl}:`, text);
              
              try {
                // Try to parse as JSON
                const data = JSON.parse(text);
                console.log(`Parsed API response from ${baseUrl}:`, data);
                responseData = data;
                
                // Found a working URL, break out of the loop
                break;
              } catch (parseErr) {
                console.error(`Failed to parse JSON from ${baseUrl}:`, parseErr, 'Raw text:', text);
                fetchError = new Error(`JSON parse error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
              }
            } else {
              console.warn(`API at ${baseUrl} returned status ${response.status}`);
              fetchError = new Error(`API error: ${response.status} ${response.statusText}`);
            }
          } catch (err) {
            console.warn(`Failed to fetch from ${baseUrl}:`, err);
            fetchError = err instanceof Error ? err : new Error(String(err));
            // Continue trying other URLs
          }
        }
        
        // If all URLs failed, throw the last error
        if (!responseData && fetchError) {
          throw fetchError;
        }
      } else {
        // For web app, use the relative URL
        const apiUrl = '/api/poll/simple';
        console.log(`Fetching poll data from: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000)
        });
        
        console.log('Poll API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('Raw API response:', text);
        responseData = JSON.parse(text);
        console.log('Parsed API response:', responseData);
      }
      
      // Process and normalize the response data regardless of format
      if (responseData) {
        const normalizedData = normalizePollData(responseData);
        console.log('Normalized poll data:', normalizedData);
        setData(normalizedData);
      } else {
        throw new Error('No data received from API');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching poll data:', err);
      setError(`Failed to load poll data: ${err instanceof Error ? err.message : String(err)}`);
      
      // Always set fallback data for native apps
      if (isNative) {
        console.log('Setting fallback data for Tauri app');
        setData({
          id: 'fallback-' + Date.now(),
          timestamp: new Date().toISOString(),
          results: [
            { option: 'Pizza', count: 4 },
            { option: 'Burgers', count: 2 },
            { option: 'Tacos', count: 2 },
            { option: 'Sushi', count: 2 }
          ],
          totalVotes: 10
        });
      }
      
      setLoading(false);
    }
  };

  // Fetch data on mount with retry logic
  useEffect(() => {
    const loadWithRetry = async () => {
      try {
        // For native apps, add a small delay before first fetch
        const isNative = typeof window !== 'undefined' && !!(window as any).__TAURI__;
        if (isNative && retryCount === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        await fetchPollData();
      } catch (err) {
        console.error('Failed to load poll data:', err);
        setError(`Failed to load poll data: ${err instanceof Error ? err.message : String(err)}`);
        
        // Retry logic (max 3 retries)
        if (retryCount < 3) {
          console.log(`Retrying... (${retryCount + 1}/3)`);
          const timeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1500 * (retryCount + 1));
          
          return () => clearTimeout(timeout);
        }
      }
    };
    
    loadWithRetry();
  }, [retryCount]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchPollData();
  };

  // Helper function to render poll results with detailed logging
  const renderPollResults = () => {
    // Debug info
    if (data) {
      console.log('Rendering data:', data);
      console.log('Has results array:', !!data.results);
      console.log('Results length:', data.results?.length);
      console.log('Total votes:', data.totalVotes);
    }
    
    // Handle the case where data exists but no results array
    const pollResults = data?.results || [];
    const totalVotes = data?.totalVotes || 0;
    
    return (
      <div className="space-y-4">
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 font-medium">
            Poll Results (Total Votes: {totalVotes})
          </div>
          {pollResults.length > 0 ? (
            <ul className="divide-y">
              {pollResults.map((item, index) => (
                <li key={index} className="px-4 py-3 flex justify-between items-center">
                  <span className="font-medium">{item.option}</span>
                  <span className="bg-blue-100 text-blue-800 text-sm rounded-full px-3 py-1">
                    {item.count} {item.count === 1 ? 'vote' : 'votes'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-gray-500 italic">No votes yet</p>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <button
            onClick={handleRefresh}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            )}
          >
            Refresh Data
          </button>
          
          <div className="text-xs text-gray-500">
            {data?.timestamp && `Updated: ${new Date(data.timestamp).toLocaleTimeString()}`}
          </div>
        </div>
        
        {/* Add a debug panel that shows the raw data in development mode */}
        {typeof window !== 'undefined' && !!(window as any).__TAURI__ && (
          <details className="mt-4 border rounded p-2 text-xs">
            <summary className="font-bold">Debug Info</summary>
            <pre className="mt-2 bg-gray-100 p-2 overflow-auto max-h-48">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Poll Results</h2>
      
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-center">
            <p>Loading poll data...</p>
          </div>
        </div>
      )}
      
      {/* Results display */}
      {!loading && data && renderPollResults()}
    </div>
  );
}