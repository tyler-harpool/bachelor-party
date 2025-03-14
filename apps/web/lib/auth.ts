import { useState, useEffect } from 'react';

// Define user type
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Storage keys
const TOKEN_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'user_data';

/**
 * Enhanced client-side authentication hook with PASETO token support
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from storage on initial render
  useEffect(() => {
    const loadAuth = async () => {
      console.log('Auth hook - Loading authentication state...');
      // Try to get token and user from localStorage
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      
      console.log('Auth hook - Local storage:', { 
        hasToken: !!storedToken, 
        hasUser: !!storedUser 
      });
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('Auth hook - Loaded user from localStorage:', parsedUser);
          setToken(storedToken);
          setUser(parsedUser);
        } catch (e) {
          console.error('Failed to parse stored user', e);
          clearStorage();
        }
      } else {
        console.log('Auth hook - No data in localStorage, trying to fetch from API');
        // If no token in localStorage, try to fetch user info using cookies
        // This is useful for web clients where the token is in HttpOnly cookies
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include' // Send cookies
          });
          
          console.log('Auth hook - /api/auth/me response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Auth hook - /api/auth/me response data:', data);
            
            if (data.success && data.data.user) {
              console.log('Auth hook - Setting user from API:', data.data.user);
              setUser(data.data.user);
              // Still don't have the token in JS, but the cookie is there
            }
          } else {
            console.log('Auth hook - Not authenticated via API');
          }
        } catch (error) {
          console.error('Failed to fetch user from API:', error);
        }
      }
      
      setLoading(false);
    };
    
    loadAuth();
  }, []);

  // Clear all auth storage
  const clearStorage = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  // Login function
  const login = async (email: string, password: string) => {
    console.log('Auth hook - Login attempt with email:', email);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Accept cookies in response
    });

    console.log('Auth hook - Login response status:', response.status);
    const data = await response.json();
    console.log('Auth hook - Login response data:', data);

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }

    // Get user data and verify it contains firstName
    const userData = data.data.user;
    console.log('Auth hook - Setting user data:', userData);
    
    if (!userData || !userData.firstName) {
      console.error('Auth hook - Missing firstName in user data');
    }

    // Save user and token to state and localStorage
    setUser(userData);
    if (data.data.token) {
      setToken(data.data.token);
      localStorage.setItem(TOKEN_STORAGE_KEY, data.data.token);
    }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

    return userData;
  };

  // Signup function
  const signup = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Signup failed');
    }

    return data.data.user;
  };

  // Logout function - both clears local storage and calls logout endpoint to clear cookies
  const logout = async () => {
    // Clear local state and storage
    clearStorage();
    
    // Call logout API to clear cookies
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Function to get the auth header for API requests
  const getAuthHeader = () => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  // Authenticated fetch function that automatically adds the auth token
  const authFetch = async (url: string, options: RequestInit = {}) => {
    // Merge auth headers with any provided headers
    const headers = {
      ...options.headers,
      ...getAuthHeader(),
    };
    
    // Make the request with auth headers
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Always include cookies too
    });
    
    // If unauthorized (token expired), try to refresh or logout
    if (response.status === 401) {
      // For now, just logout since we don't have refresh token logic
      await logout();
      throw new Error('Session expired. Please login again.');
    }
    
    return response;
  };

  return {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    authFetch,
    getAuthHeader,
    isAuthenticated: !!user,
  };
}