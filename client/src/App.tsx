import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import ProgrammerRegister from "@/pages/programmer-register";
import VerifyEmail from "@/pages/verify-email";
import VerifyOTP from "@/pages/verify-otp";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Home from "@/pages/home";
import Projects from "@/pages/projects";
import NewProject from "@/pages/new-project";
import ProjectDetail from "@/pages/project-detail";
import IDE from "@/pages/ide";
import Balance from "@/pages/balance";
import Settings from "@/pages/settings";
import AISettings from "@/pages/ai-settings";
import ProgrammerDashboard from "@/pages/programmer-dashboard";

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/auth/programmer" component={ProgrammerRegister} />
        <Route path="/auth/verify-email" component={VerifyEmail} />
        <Route path="/auth/verify-otp" component={VerifyOTP} />
        <Route path="/auth/forgot-password" component={ForgotPassword} />
        <Route path="/auth/reset-password" component={ResetPassword} />
        <Route component={Landing} />
      </Switch>
    );
  }

  const isProgrammer = user?.role === "programmer";

  return (
    <Switch>
      <Route path="/ide/:id">
        {(params) => (
          <div className="h-screen w-full">
            <IDE />
          </div>
        )}
      </Route>
      <Route>
        {() => (
          <AuthenticatedLayout>
            <Switch>
              <Route path="/" component={isProgrammer ? ProgrammerDashboard : Home} />
              <Route path="/projects" component={Projects} />
              <Route path="/projects/new" component={NewProject} />
              <Route path="/projects/:id" component={ProjectDetail} />
              <Route path="/balance" component={Balance} />
              <Route path="/settings" component={Settings} />
              <Route path="/ai-settings" component={AISettings} />
              <Route path="/programmer" component={ProgrammerDashboard} />
              <Route path="/programmer/tasks" component={ProgrammerDashboard} />
              <Route path="/programmer/earnings" component={Balance} />
              <Route component={NotFound} />
            </Switch>
          </AuthenticatedLayout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
