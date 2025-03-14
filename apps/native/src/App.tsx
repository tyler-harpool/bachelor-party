import { useState } from "react";
import { AnalyzeTextView } from "@repo/ui/views/analyzeTextView";
import { Header } from "@repo/ui/components/header";

// Import both poll components
import { PollSystem } from "@repo/ui/components/poll-system";
import { NativePollView } from "@repo/ui/components/native-poll-view";

// Main App component with native-optimized routing
function App() {
  const [currentRoute, setCurrentRoute] = useState("/");
  
  // Native-specific navigation handler
  const handleNavigate = (route: string) => {
    console.log(`NATIVE: Navigating to ${route}`);
    setCurrentRoute(route);
  };
  
  // Render the appropriate content based on the current route
  const renderContent = () => {
    console.log('Rendering content for route:', currentRoute);
    switch (currentRoute) {
      case "/test-poll":
        console.log('Rendering PollSystem component');
        return <PollSystem />;
      case "/native-poll":
        console.log('Rendering NativePollView component');
        return <NativePollView />;
      case "/":
      default:
        console.log('Rendering AnalyzeTextView component');
        return <AnalyzeTextView isNative={true} />;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        currentRoute={currentRoute} 
        onNavigate={handleNavigate} 
        isNative={true} 
      />
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
