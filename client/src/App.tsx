import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import FeedbackAdmin from "./pages/FeedbackAdmin";
import LoadingScreen from "@/components/LoadingScreen";
import { useLoading } from "@/hooks/useLoading";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/feedback-admin" component={FeedbackAdmin} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showInitialLoading, setShowInitialLoading] = useState(true);

  useEffect(() => {
    // Show initial loading screen on app startup
    const timer = setTimeout(() => {
      setShowInitialLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LoadingScreen 
          isLoading={showInitialLoading} 
          loadingType="initial"
          duration={1500}
          onComplete={() => setShowInitialLoading(false)}
        />
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
