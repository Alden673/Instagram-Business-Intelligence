import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/app-shell';
import Dashboard from '@/pages/dashboard';
import Planner from '@/pages/planner';
import Assistant from '@/pages/assistant';
import Settings from '@/pages/settings';
import type { InstagramAnalysis } from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  const [analysis, setAnalysis] = useState<InstagramAnalysis | null>(null);
  return (
    <AppShell accountName={analysis?.accountName} hasAnalysis={Boolean(analysis)}>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/"><Dashboard analysis={analysis} onAnalysis={setAnalysis} /></Route>
          <Route path="/planner"><Planner analysis={analysis} /></Route>
          <Route path="/assistant"><Assistant analysis={analysis} /></Route>
          <Route path="/settings"><Settings analysis={analysis} onAnalysis={setAnalysis} onClear={() => setAnalysis(null)} /></Route>
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppShell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
