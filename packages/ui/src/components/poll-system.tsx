import { useState, useEffect } from 'react';
import { buttonVariants } from "./button";
import { cn } from "../lib/utils";

// Define types for poll data
interface PollOption {
  option: string;
  count: number;
}

interface PollData {
  items: PollOption[];
  count: number;
  timestamp: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Create a simple, consistent Poll System component that works in both web and native
export function PollSystem() {
  // Define multiple possible API base URLs to try
  const apiBaseUrls = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000" // Adding 0.0.0.0 which can work better in some network configurations
  ];
  
  // State for poll functionality
  const [pollResults, setPollResults] = useState<PollOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [newOption, setNewOption] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Function to run DB tests - detailed logging for debugging
  const runTests = async () => {
    setLoading(true);
    setMessage('');

    // Add comprehensive logging to understand what's happening
    console.group("🔍 Poll System - Run Tests");
    console.log('⏳ Initiating API request to:', `${apiBaseUrl}/api/poll/test`);

    try {
      // Attempt fetch with detailed error reporting
      const response = await fetch(`${apiBaseUrl}/api/poll/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('✅ Response received:', response);
      console.log('📊 Response status:', response.status);
      console.log('📜 Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Non-OK response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText || response.statusText}`);
      }

      // Log the raw response text before parsing
      const responseText = await response.text();
      console.log('📄 Raw response text:', responseText);

      // Try to parse the JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📦 Parsed JSON data:', data);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error(`Failed to parse response as JSON: ${parseError.message}`);
      }

      // Handle different response formats
      console.log('🧩 Data structure check:');
      console.log('- Has data property:', !!data.data);
      console.log('- Has tests property:', !!data.tests);
      console.log('- Success property value:', data.success);

      // Determine which format we have and set the data accordingly
      if (data.data) {
        console.log('✅ Using data.data format');
        setTestResults(data.data);
      } else if (data.tests) {
        console.log('✅ Using data.tests format');
        setTestResults(data);
      } else {
        console.error('❌ Unexpected data format:', data);
        setMessage('Unexpected response format from server');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setMessage(`Error running tests: ${(error as Error).message}`);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  // Function to get poll results - now tries multiple URLs
  const getPollResults = async () => {
    setLoading(true);
    setMessage('');
    setError(null);
    
    try {
      // For native applications, try multiple URLs in sequence
      const isNative = typeof window !== 'undefined' && !!(window as any).__TAURI__;
      let lastError = null;
      let fetchSucceeded = false;
      let responseData = null;
      
      // Helper function to attempt fetch from a URL
      const attemptFetch = async (url) => {
        console.log(`Trying to fetch poll results from: ${url}`);
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(4000) // Shorter timeout since we'll try multiple URLs
          });
          
          console.log(`Poll API response status from ${url}:`, response.status);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
          
          // Parse JSON response
          const data = await response.json();
          console.log(`Poll API response from ${url}:`, data);
          return { success: true, data };
        } catch (err) {
          console.warn(`Failed to fetch from ${url}:`, err);
          return { success: false, error: err };
        }
      };
      
      // Try each URL in sequence for native apps
      if (isNative) {
        setMessage('Connecting to server...');
        
        for (const baseUrl of apiBaseUrls) {
          const url = `${baseUrl}/api/poll`;
          const result = await attemptFetch(url);
          
          if (result.success) {
            fetchSucceeded = true;
            responseData = result.data;
            console.log(`Successfully connected to ${url}`);
            break; // Exit the loop on first success
          } else {
            lastError = result.error;
          }
        }
        
        if (!fetchSucceeded) {
          throw lastError || new Error('Failed to connect to any server URL');
        }
      } else {
        // For web app, just use the first URL
        const url = `${apiBaseUrls[0]}/api/poll`;
        console.log('Fetching poll results from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(8000) // 8 second timeout
        });
        
        console.log('Poll API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        responseData = await response.json();
        console.log('Poll API response:', responseData);
      }
      
      // Now process the response data
      const data = responseData;
      
      // More detailed logging to diagnose the issue
      console.log('Poll API response structure:', {
        hasSuccess: !!data.success,
        hasData: !!data.data,
        dataType: data.data ? typeof data.data : 'undefined',
        hasItems: data.data && data.data.items ? !!data.data.items : false,
        fullData: JSON.stringify(data, null, 2)
      });
      
      // Handle standard API response format with data property
      if (data.success && data.data) {
        let items = [];
        
        // Different ways the items might be available in the response
        if (data.data.items && Array.isArray(data.data.items)) {
          console.log('Found items array in data.data.items');
          items = data.data.items;
        } else if (Array.isArray(data.data)) {
          console.log('data.data is directly an array');
          items = data.data;
        } else {
          console.log('Unexpected data format, searching for arrays in the response');
          // Try to find any array in the response object
          if (typeof data.data === 'object') {
            Object.entries(data.data).forEach(([key, value]) => {
              if (Array.isArray(value) && value.length > 0) {
                console.log(`Found array in data.data.${key}`);
                items = value;
              }
            });
          }
        }
        
        if (items.length > 0) {
          console.log('Using found items:', items);
          setPollResults(items);
        } else {
          console.warn('No items found in the response');
          throw new Error('No poll options found in the response');
        }
      } else {
        throw new Error('Unexpected response format: missing success or data properties');
      }
    } catch (error) {
      console.error('Error fetching poll results:', error);
      setError(`Failed to load poll results: ${error instanceof Error ? error.message : String(error)}`);
      
      // Provide mock data in all environments if API fails,
      // but show error message differently based on environment
      const isNative = typeof window !== 'undefined' && !!(window as any).__TAURI__;
      
      // Always set mock data for visual testing
      console.log('Setting fallback data');
      setPollResults([
        { option: 'Pizza', count: 4 },
        { option: 'Burgers', count: 2 },
        { option: 'Tacos', count: 2 },
        { option: 'Sushi', count: 2 }
      ]);
      
      // In native, make the error less prominent (just show in message area)
      if (isNative) {
        setError(null); // Clear the error since we're showing mock data
        setMessage(`Note: Using sample data. (API error: ${error instanceof Error ? error.message : String(error)})`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to submit a new vote - now tries multiple URLs
  const submitVote = async () => {
    if (!newOption.trim()) {
      setMessage('Please enter an option.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError(null);
    
    // For native applications, try multiple URLs in sequence
    const isNative = typeof window !== 'undefined' && !!(window as any).__TAURI__;
    let lastError = null;
    let submitSucceeded = false;
    let responseData = null;
    
    // Helper function to attempt submission to a URL
    const attemptSubmit = async (url) => {
      console.log(`Trying to submit vote to: ${url}`);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ option: newOption }),
          signal: AbortSignal.timeout(4000) // Shorter timeout since we'll try multiple URLs
        });
        
        console.log(`Vote submission status from ${url}:`, response.status);
        
        // If the response is not ok, try to get error details
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Server error: ${response.status}`;
          
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error && errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          } catch (e) {
            // If parsing fails, use status text
            if (response.statusText) {
              errorMessage = response.statusText;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        // Parse the response
        const data = await response.json();
        console.log(`Vote submission response from ${url}:`, data);
        return { success: true, data };
      } catch (err) {
        console.warn(`Failed to submit vote to ${url}:`, err);
        return { success: false, error: err };
      }
    };

    try {
      // Try each URL in sequence for native apps
      if (isNative) {
        setMessage('Submitting vote...');
        
        for (const baseUrl of apiBaseUrls) {
          const url = `${baseUrl}/api/poll`;
          const result = await attemptSubmit(url);
          
          if (result.success) {
            submitSucceeded = true;
            responseData = result.data;
            console.log(`Successfully submitted vote to ${url}`);
            break; // Exit the loop on first success
          } else {
            lastError = result.error;
            
            // If it's a duplicate vote error, no need to try other URLs
            if (result.error instanceof Error && 
                result.error.message.includes('DUPLICATE_VOTE')) {
              throw result.error;
            }
          }
        }
        
        if (!submitSucceeded) {
          throw lastError || new Error('Failed to submit vote to any server URL');
        }
      } else {
        // For web app, just use the first URL
        const url = `${apiBaseUrls[0]}/api/poll`;
        console.log('Submitting vote to:', url);
        
        const result = await attemptSubmit(url);
        if (result.success) {
          responseData = result.data;
        } else {
          throw result.error;
        }
      }
      
      // Clear input and show success message
      setNewOption('');
      setMessage(`Vote for "${newOption}" submitted successfully!`);
      
      // Refresh poll results after a short delay
      setTimeout(() => {
        getPollResults();
      }, 500);
      
    } catch (error) {
      console.error('Error submitting vote:', error);
      
      // Provide a user-friendly error message
      if (error instanceof Error && error.message.includes('DUPLICATE_VOTE')) {
        setMessage('You have already voted with this IP address.');
      } else if (error instanceof Error && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('abort')
      )) {
        setMessage('Network connection error. Make sure the server is running.');
      } else {
        setMessage(`Error submitting vote: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch poll results on component mount - now with better handling for native
  useEffect(() => {
    // Immediately show mock data to prevent empty UI
    setPollResults([
      { option: 'Pizza', count: 4 },
      { option: 'Burgers', count: 2 },
      { option: 'Tacos', count: 2 },
      { option: 'Sushi', count: 2 }
    ]);
    
    // Simple data loading function with better native handling
    const loadData = async () => {
      try {
        const isNative = typeof window !== 'undefined' && !!(window as any).__TAURI__;
        
        // In native environment, wait longer before API call
        if (isNative) {
          console.log('Native environment detected - adding longer initialization delay');
          setMessage('Connecting to database...');
          
          // Add a longer delay in native environment to ensure network is ready
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Try to get real data from API
        await getPollResults();
        setMessage(''); // Clear any message on success
        
      } catch (error) {
        console.error('Error in initial data load:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Set a helpful error message based on error type
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('abort')) {
          setMessage('Network connection error. Using sample data.');
        } else {
          // Keep the mock data visible, just show a message
          setMessage(`Using sample data. (API error: ${errorMessage})`);
        }
      }
    };

    // Add a slight delay before even starting the data load
    // This helps ensure the UI is rendered first
    setTimeout(() => {
      loadData();
    }, 100);
  }, []);

  return (
    <div className="container mx-auto py-4 px-4 max-w-4xl">
      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Poll Results Section */}
      <div className="mb-8 p-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Poll Results</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4 disabled:opacity-50"
          onClick={getPollResults}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Results'}
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-center">
              <p className="text-blue-500">Loading poll results...</p>
            </div>
          </div>
        ) : pollResults && pollResults.length > 0 ? (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Current Standings:</h3>
            <ul className="space-y-2">
              {pollResults.map((result, index) => (
                <li key={index} className="p-3 border rounded flex justify-between items-center">
                  <span className="font-medium">{result.option}</span>
                  <span className="bg-blue-100 text-blue-800 text-sm rounded-full px-3 py-1">
                    {result.count} {result.count === 1 ? 'vote' : 'votes'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-gray-500">
                {pollResults.length} {pollResults.length === 1 ? 'option' : 'options'} found
              </p>
              <p className="text-xs text-gray-500 italic">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            
            {/* Debug panel only visible in native app */}
            {typeof window !== 'undefined' && !!(window as any).__TAURI__ && (
              <details className="mt-4 border rounded p-2 text-xs">
                <summary className="font-bold">Debug Info</summary>
                <pre className="mt-2 bg-gray-100 p-2 overflow-auto max-h-48">
                  {JSON.stringify(pollResults, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ) : (
          <div className="py-6 text-center border rounded bg-gray-50">
            <p className="text-gray-500">No votes recorded yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Submit your vote below to get started!
            </p>
          </div>
        )}
      </div>

      {/* Submit Vote Section */}
      <div className="p-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Submit Your Vote</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            className="flex-grow px-3 py-2 border rounded"
            placeholder="Enter your option"
            disabled={loading}
          />
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            onClick={submitVote}
            disabled={loading || !newOption.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Vote'}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded ${message.includes('Error') || message.includes('failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
      
      {/* Run database tests section - useful for debugging */}
      {typeof window !== 'undefined' && !!(window as any).__TAURI__ && (
        <div className="mt-8 p-4 border rounded-lg shadow-sm">
          <h3 className="font-medium mb-2">Database Connection Test</h3>
          <button
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
            onClick={runTests}
            disabled={loading}
          >
            Run DB Test
          </button>
        </div>
      )}
    </div>
  );
}
