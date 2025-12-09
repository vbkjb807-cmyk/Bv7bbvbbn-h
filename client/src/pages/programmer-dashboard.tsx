import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  FolderOpen, 
  Clock, 
  DollarSign, 
  CheckCircle,
  Star,
  MessageSquare,
  Play,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { WorkTimer } from "@/components/WorkTimer";
import type { Project, Task, Programmer } from "@shared/schema";

export default function ProgrammerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isWorking, setIsWorking] = useState(false);
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);

  const { data: programmerProfile, isLoading: profileLoading } = useQuery<Programmer>({
    queryKey: ["/api/programmer/profile"],
  });

  const { data: assignedProjects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/programmer/projects"],
  });

  const { data: availableTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/programmer/available-tasks"],
  });

  const updateAvailability = useMutation({
    mutationFn: async (available: boolean) => {
      await apiRequest("PATCH", "/api/programmer/profile", { available });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programmer/profile"] });
      toast({
        title: "Availability Updated",
        description: programmerProfile?.available 
          ? "You are now marked as unavailable"
          : "You are now available for new tasks",
      });
    },
  });

  const startWork = () => {
    setIsWorking(true);
    setWorkStartTime(new Date());
    toast({
      title: "Work Session Started",
      description: "Your time is now being tracked.",
    });
  };

  const pauseWork = () => {
    setIsWorking(false);
    toast({
      title: "Work Paused",
      description: "Your session has been paused.",
    });
  };

  const endWork = () => {
    setIsWorking(false);
    setWorkStartTime(null);
    toast({
      title: "Work Session Ended",
      description: "Your work has been submitted for review.",
    });
  };

  if (profileLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const totalEarnings = parseFloat(programmerProfile?.totalEarnings || "0");
  const hourlyRate = parseFloat(programmerProfile?.hourlyRate || "25");
  const rating = parseFloat(programmerProfile?.rating || "0");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Programmer Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your tasks and track your earnings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="availability" className="text-sm">Available for work</Label>
          <Switch
            id="availability"
            checked={programmerProfile?.available}
            onCheckedChange={(checked) => updateAvailability.mutate(checked)}
            data-testid="switch-availability"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-green-500">
              ${totalEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ${hourlyRate.toFixed(2)}/hr
            </div>
            <p className="text-xs text-muted-foreground">Current rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {programmerProfile?.completedTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{rating.toFixed(1)}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Work Timer</CardTitle>
              <CardDescription>
                Track your work time for accurate billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkTimer
                isRunning={isWorking}
                startTime={workStartTime}
                onStart={startWork}
                onPause={pauseWork}
                onEnd={endWork}
                hourlyRate={programmerProfile?.hourlyRate || "25.00"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Assigned Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : assignedProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No assigned projects</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {programmerProfile?.available
                      ? "New projects will appear here when assigned"
                      : "Enable availability to receive new projects"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 rounded-lg border hover-elevate cursor-pointer"
                      data-testid={`project-item-${project.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{project.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {project.description}
                          </p>
                        </div>
                        <Badge variant={project.status === "in_progress" ? "default" : "secondary"}>
                          {project.status === "in_progress" ? "In Progress" : "Assigned"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm text-muted-foreground">
                          Budget: <span className="font-mono">${parseFloat(project.budget || "0").toFixed(2)}</span>
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/programmer/projects/${project.id}`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View & Chat
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Tasks</CardTitle>
              <CardDescription>
                Tasks waiting for a programmer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableTasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No available tasks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border hover-elevate cursor-pointer"
                    >
                      <h4 className="font-medium text-sm truncate">{task.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                      <Button size="sm" className="w-full mt-3">
                        <Play className="h-3 w-3 mr-2" />
                        Accept Task
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(programmerProfile?.skills || ["JavaScript", "TypeScript", "React", "Node.js"]).map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
