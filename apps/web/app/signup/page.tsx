"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@repo/ui/components";
import Link from "next/link";
import { useAuth } from "../../lib/auth";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();
  const { signup } = useAuth();

  const handleSignup = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    setIsLoading(true);
    setError(undefined);

    try {
      await signup(data);
      router.push("/login?from=signup"); // Redirect to login page
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthForm
          mode="signup"
          onSubmit={handleSignup}
          isLoading={isLoading}
          error={error}
        />

        <div className="mt-4 text-center">
          <span className="text-gray-600">Already have an account? </span>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}