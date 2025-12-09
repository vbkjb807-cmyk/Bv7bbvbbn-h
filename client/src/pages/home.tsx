import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  FolderOpen, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { ProjectCard } from "@/components/ProjectCard";
import { AgentCard, AgentType, AgentStatus } from "@/components/AgentCard";
import type { Project } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: stats } = useQuery<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalSpent: string;
  }>({
    queryKey: ["/api/stats"],
  });

  const recentProjects = projects?.slice(0, 3) || [];

  const agentStatuses: { type: AgentType; status: AgentStatus }[] = [
    { type: "ui_ux", status: "idle" },
    { type: "backend", status: "idle" },
    { type: "database", status: "idle" },
    { type: "qa", status: "idle" },
    { type: "devops", status: "idle" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-welcome">
            Welcome back, {user?.firstName || "User"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your projects
          </p>
        </div>
        <Button asChild data-testid="button-new-project">
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-projects">
              {stats?.totalProjects ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-projects">
              {stats?.activeProjects ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-completed-projects">
              {stats?.completedProjects ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="stat-total-spent">
              ${parseFloat(stats?.totalSpent || "0").toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>AI Agents Status</CardTitle>
              <Bot className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {agentStatuses.map((agent) => (
                  <AgentCard 
                    key={agent.type} 
                    type={agent.type} 
                    status={agent.status}
                    compact
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Recent Projects</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects" data-testid="link-view-all-projects">
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No projects yet</p>
                  <Button className="mt-4" asChild>
                    <Link href="/projects/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {recentProjects.map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project}
                      onClick={() => window.location.href = `/projects/${project.id}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <BalanceDisplay 
            balance={user?.balance || "0"} 
            onTopUp={() => window.location.href = "/balance"}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/projects/new" data-testid="quick-action-new-project">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Project
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/balance" data-testid="quick-action-top-up">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Top Up Balance
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/projects" data-testid="quick-action-view-projects">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  View All Projects
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">AI Agent Failed?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Request a human programmer to complete your project with professional quality.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
