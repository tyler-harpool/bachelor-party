"use client";

import { useState } from "react";
import { Button } from "./button";
import { Card } from "./card";

interface AuthFormProps {
  mode: "login" | "signup";
  onSubmit: (data: {
    firstName?: string;
    lastName?: string;
    email: string;
    password: string;
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function AuthForm({ mode, onSubmit, isLoading, error }: AuthFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(error || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (mode === "signup") {
        if (!firstName.trim()) {
          setFormError("First name is required");
          return;
        }
        if (!lastName.trim()) {
          setFormError("Last name is required");
          return;
        }
      }

      if (!email.trim()) {
        setFormError("Email is required");
        return;
      }

      if (!password.trim()) {
        setFormError("Password is required");
        return;
      }

      if (mode === "signup" && password.length < 8) {
        setFormError("Password must be at least 8 characters");
        return;
      }

      await onSubmit({
        ...(mode === "signup" ? { firstName, lastName } : {}),
        email,
        password,
      });
    } catch (err) {
      setFormError((err as Error).message || "An unknown error occurred");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="px-6 py-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === "login" ? "Login" : "Create an account"}
        </h2>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <div className="mb-4">
                <label
                  htmlFor="firstName"
                  className="block text-gray-700 text-sm font-medium mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="lastName"
                  className="block text-gray-700 text-sm font-medium mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-medium mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-medium mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading
              ? "Loading..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </Button>
        </form>
      </div>
    </Card>
  );
}