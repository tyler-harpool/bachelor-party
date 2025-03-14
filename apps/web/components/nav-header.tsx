"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth";

export default function NavHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  
  console.log('NavHeader - Auth state:', { isAuthenticated, user });

  const handleLogout = () => {
    console.log('Logging out...');
    logout();
    // No need to redirect, as the protected routes will do that automatically
  };

  return (
    <header className="border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <Link href="/" className="text-xl font-bold">
            Bachelor Party App
          </Link>
        </div>
        <nav>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Dashboard
              </Link>
              <span className="text-gray-600">
                Hi, {user?.firstName}
              </span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <ul className="flex space-x-4">
              <li>
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
}