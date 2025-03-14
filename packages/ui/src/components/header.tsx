import { cn } from "../lib/utils";
import { buttonVariants } from "./button";
import React from "react";

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isNative: boolean;
}

export function Header({ currentRoute, onNavigate, isNative }: HeaderProps) {
  const isActive = (route: string) => currentRoute === route;

  return (
    <header className="flex justify-between items-center p-4 border-b mb-4">
      <h1 className="text-xl font-bold">Bachelor Party App</h1>
      
      <nav className="flex gap-2">
        <button
          onClick={() => onNavigate('/')}
          className={cn(
            buttonVariants({ variant: isActive('/') ? "default" : "outline" }),
            isActive('/') && "pointer-events-none"
          )}
        >
          Text Analysis
        </button>
        
        <button
          onClick={() => onNavigate('/test-poll')}
          className={cn(
            buttonVariants({ variant: isActive('/test-poll') ? "default" : "outline" }),
            isActive('/test-poll') && "pointer-events-none"
          )}
        >
          Poll System
        </button>
        
        {isNative && (
          <button
            onClick={() => onNavigate('/native-poll')}
            className={cn(
              buttonVariants({ variant: isActive('/native-poll') ? "default" : "outline" }),
              isActive('/native-poll') && "pointer-events-none"
            )}
          >
            Native Poll
          </button>
        )}
      </nav>

      {isNative && (
        <div className="text-xs bg-yellow-100 rounded-full px-2 py-1">Native App</div>
      )}
    </header>
  );
}