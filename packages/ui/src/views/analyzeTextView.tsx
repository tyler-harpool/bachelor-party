import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Textarea } from "@repo/ui/components/textarea";
import { Button, buttonVariants } from "@repo/ui/components/button";
import { TextAnalysisResult } from "../types/text-analysis.js";
import { cn } from "@repo/ui/lib/utils";

function getSentimentText(score: number): string {
  if (score === 0) return "Neutral 😐";
  return score > 0 ? "Positive 🙂" : "Negative ☹️";
}

// Add TypeScript declaration for Tauri's global object
declare global {
  interface Window {
    __TAURI__?: {
      window?: {
        getCurrent: () => {
          navigate: (path: string) => Promise<void>;
        };
      }
    };
    __APP_NAVIGATION__?: {
      navigateTo: (route: string) => void;
    };
  }
}

interface AnalyzeTextViewProps {
  isNative?: boolean;
}

export const AnalyzeTextView = ({ isNative = false }: AnalyzeTextViewProps) => {
  const [sourceText, setSourceText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TextAnalysisResult | null>(null);
  const apiBaseUrl = "http://localhost:3000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/text-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: sourceText }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.data);
      } else {
        console.error(response.statusText);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Header/navigation is now handled by the Header component except for web mode */}
      {!isNative && (
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Text Analysis App</h1>
          <button 
            onClick={() => {
              // Only for web navigation - native navigation is handled by the Header component
              window.location.href = '/test-poll';
            }}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-800"
            )}
          >
            View Poll System
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Enter your text here..."
          className="min-h-[100px]"
        />
        <Button type="submit" disabled={isLoading}>
          Analyze Text
        </Button>
      </form>

      {result && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="font-semibold">Word Count:</dt>
                <dd>{result.analysis.wordCount}</dd>
              </div>
              <div>
                <dt className="font-semibold">Character Count:</dt>
                <dd>{result.analysis.charCount}</dd>
              </div>
              <div>
                <dt className="font-semibold">Most Frequent Word:</dt>
                <dd>{result.analysis.mostFrequentWord}</dd>
              </div>
              <div>
                <dt className="font-semibold">Sentiment Score:</dt>
                <dd>{getSentimentText(result.analysis.sentimentScore)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-semibold">Timestamp:</dt>
                <dd>{new Date(result.timestamp).toLocaleString()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
