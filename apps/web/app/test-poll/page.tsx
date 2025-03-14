'use client';

import { PollSystem } from '@repo/ui/components/poll-system';
import Link from 'next/link';
import { buttonVariants } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
export default function TestPollPage() {
  return (
    <div>
      <div className="container mx-auto py-2 px-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Poll System</h1>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-800"
            )}
          >
            Back to Text Analysis
          </Link>
        </div>
      </div>
      
      <PollSystem />
    </div>
  );
}