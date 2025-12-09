import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Bot, 
  User, 
  MessageSquare,
  FileCode,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Code,
  Terminal,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AgentCard, AgentType, AgentStatus } from "@/components/AgentCard";
import { FileList } from "@/components/FileList";
import { ChatPanel } from "@/components/ChatPanel";
import { AIChatInterface } from "@/components/AIChatInterface";
import type { Project, File, Message, AgentLog } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-muted", icon: Clock },
  ai_processing: { label: "AI Processing", color: "bg-blue-500/10 text-blue-600", icon: Bot },
  ai_completed: { label: "AI Completed", color: "bg-green-500/10 text-green-600", icon: CheckCircle },
  ai_failed: { label: "AI Failed", color: "bg-red-500/10 text-red-600", icon: AlertCircle },
  human_requested: { label: "Awaiting Programmer", color: "bg-orange-500/10 text-orange-600", icon: Clock },
  human_assigned: { label: "Programmer Assigned", color: "bg-purple-500/10 text-purple-600", icon: User },
  in_progress: { label: "In Progress", color: "bg-yellow-500/10 text-yellow-600", icon: Loader2 },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-600", icon: CheckCircle },
};

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [activeTab, setActiveTab] = useState("ai-chat");

  const projectId = params?.id;

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: files = [] } = useQuery<File[]>({
    queryKey: ["/api/projects", projectId, "files"],
    enabled: !!projectId,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/projects", projectId, "messages"],
    enabled: !!projectId,
  });

  const { data: agentLogs = [] } = useQuery<AgentLog[]>({
    queryKey: ["/api/projects", projectId, "agents"],
    enabled: !!projectId,
  });

  const startAI = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${projectId}/start-ai`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "AI Agents Started",
        description: "Your project is now being processed by AI agents.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestProgrammer = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${projectId}/request-programmer`, {
        reason: requestReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      setRequestDialogOpen(false);
      setRequestReason("");
      toast({
        title: "Request Submitted",
        description: "A professional developer will be assigned to your project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      await apiRequest("POST", `/api/projects/${projectId}/messages`, {
        messageText: text,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "messages"] });
    },
  });

  if (projectLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The project you're looking for doesn't exist or you don't have access.
        </p>
        <Button onClick={() => setLocation("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const status = statusConfig[project.status || "pending"];
  const StatusIcon = status.icon;
  const budgetNum = parseFloat(project.budget || "0");
  const spentNum = parseFloat(project.spent || "0");
  const progressPercent = budgetNum > 0 ? Math.min((spentNum / budgetNum) * 100, 100) : 0;

  const getAgentStatus = (agentType: AgentType): AgentStatus => {
    const log = agentLogs.find(l => l.agentType === agentType);
    if (!log) return "idle";
    switch (log.status) {
      case "running": return "running";
      case "completed": return "completed";
      case "failed": return "failed";
      default: return "idle";
    }
  };

  const isAIProcessing = project.status === "ai_processing";
  const hasHumanAssigned = project.status === "human_assigned" || project.status === "in_progress";

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-6 border-b shrink-0">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() => setLocation("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold" data-testid="text-project-title">
            {project.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={status.color}>
              <StatusIcon className={`h-3 w-3 mr-1 ${isAIProcessing || project.status === "in_progress" ? "animate-spin" : ""}`} />
              {status.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {new Date(project.createdAt || Date.now()).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.status === "pending" && (
            <Button
              onClick={() => startAI.mutate()}
              disabled={startAI.isPending}
              data-testid="button-start-ai"
            >
              {startAI.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start AI Agents
            </Button>
          )}
          
          {files.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setLocation(`/ide/${projectId}`)}
              data-testid="button-open-ide"
            >
              <Code className="h-4 w-4 mr-2" />
              Open IDE
            </Button>
          )}

          {(project.status === "ai_failed" || project.status === "ai_completed") && (
            <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-request-programmer">
                  <User className="h-4 w-4 mr-2" />
                  Request Programmer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Human Programmer</DialogTitle>
                  <DialogDescription>
                    A professional developer will be assigned to your project.
                    They will review the AI-generated code and make necessary improvements.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      What would you like help with? (Optional)
                    </label>
                    <Textarea
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="Describe any specific issues or requirements..."
                      className="min-h-[100px]"
                      data-testid="input-request-reason"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You'll be charged based on the time spent and lines of code modified.
                  </p>
                </div>
                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => requestProgrammer.mutate()}
                    disabled={requestProgrammer.isPending}
                    data-testid="button-confirm-request"
                  >
                    {requestProgrammer.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <User className="h-4 w-4 mr-2" />
                    )}
                    Confirm Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <Button variant="ghost" size="icon" data-testid="button-project-settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-6 shrink-0">
              <TabsList className="h-12">
                <TabsTrigger value="ai-chat" className="gap-2" data-testid="tab-ai-chat">
                  <Bot className="h-4 w-4" />
                  AI Team
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-2" data-testid="tab-files">
                  <FileCode className="h-4 w-4" />
                  Files ({files.length})
                </TabsTrigger>
                <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
                  <Code className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                {hasHumanAssigned && (
                  <TabsTrigger value="programmer-chat" className="gap-2" data-testid="tab-programmer-chat">
                    <MessageSquare className="h-4 w-4" />
                    Programmer
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="ai-chat" className="flex-1 m-0 p-6 overflow-auto">
              <div className="h-full max-h-[calc(100vh-280px)]">
                <AIChatInterface
                  projectId={projectId!}
                  isAIProcessing={isAIProcessing}
                  onRequestProgrammer={() => setRequestDialogOpen(true)}
                />
              </div>
            </TabsContent>

            <TabsContent value="files" className="flex-1 m-0 overflow-auto">
              <div className="p-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Generated Files
                    </CardTitle>
                    <CardDescription>
                      {files.length} files generated by AI agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileList files={files} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="overview" className="flex-1 m-0 overflow-auto">
              <div className="p-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {project.description}
                    </p>
                    {project.requirements && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2">Technical Requirements</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {project.requirements}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI Agents Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {(["ui_ux", "backend", "database", "qa", "devops"] as AgentType[]).map((type) => (
                        <AgentCard
                          key={type}
                          type={type}
                          status={getAgentStatus(type)}
                          progress={isAIProcessing ? Math.floor(Math.random() * 100) : 0}
                          compact
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Used</span>
                            <span className="font-mono font-medium">
                              ${spentNum.toFixed(2)} / ${budgetNum.toFixed(2)}
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-3" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Remaining: <span className="font-mono font-medium text-foreground">
                            ${(budgetNum - spentNum).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-2xl font-bold">{files.length}</p>
                          <p className="text-sm text-muted-foreground">Files Created</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {files.reduce((acc, f) => acc + (f.linesCount || 0), 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">Lines of Code</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {hasHumanAssigned && user && (
              <TabsContent value="programmer-chat" className="flex-1 m-0 p-6 overflow-auto">
                <div className="h-full max-h-[calc(100vh-280px)]">
                  <ChatPanel
                    messages={messages}
                    currentUser={user}
                    otherUser={{
                      id: "programmer",
                      firstName: "Developer",
                      lastName: "",
                      profileImageUrl: null,
                    }}
                    onSendMessage={(text) => sendMessage.mutate(text)}
                    isLoading={sendMessage.isPending}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
