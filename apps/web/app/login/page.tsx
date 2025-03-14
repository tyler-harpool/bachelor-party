"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@repo/ui/components";
import Link from "next/link";
import { useAuth } from "../../lib/auth";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  // Check if user was redirected from signup page
  const fromSignup = searchParams.get('from') === 'signup';

  const handleLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError(undefined);

    try {
      await login(data.email, data.password);
      router.push("/"); // Redirect to home page
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {fromSignup && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded text-center">
            Account created successfully! Please log in.
          </div>
        )}
        
        <AuthForm
          mode="login"
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
        />

        <div className="mt-4 text-center">
          <span className="text-gray-600">Don&apos;t have an account? </span>
          <Link
            href="/signup"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}