import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Send, 
  Palette, 
  Server, 
  Database, 
  TestTube, 
  Cloud,
  Bot,
  User,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Code,
  FileCode,
  Hand,
  ChevronDown,
  ChevronUp,
  Users,
  Zap,
  MessageSquare,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export type AgentType = "ui_ux" | "backend" | "database" | "qa" | "devops";

interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentType?: AgentType;
  metadata?: {
    filesCreated?: string[];
    codeBlocks?: { language: string; code: string }[];
    isThinking?: boolean;
    progress?: number;
    taskName?: string;
  };
  createdAt: string;
}

interface AgentInfo {
  type: AgentType;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  status: "idle" | "working" | "completed" | "error";
  currentTask?: string;
  progress?: number;
}

const agentConfigs: Record<AgentType, Omit<AgentInfo, "status" | "currentTask" | "progress">> = {
  ui_ux: {
    type: "ui_ux",
    name: "UI/UX Agent",
    icon: Palette,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    description: "Designing user interfaces and experience",
  },
  backend: {
    type: "backend",
    name: "Backend Agent",
    icon: Server,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Building server-side logic and APIs",
  },
  database: {
    type: "database",
    name: "Database Agent",
    icon: Database,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Designing and implementing database schema",
  },
  qa: {
    type: "qa",
    name: "QA Agent",
    icon: TestTube,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    description: "Testing and quality assurance",
  },
  devops: {
    type: "devops",
    name: "DevOps Agent",
    icon: Cloud,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Deployment and infrastructure",
  },
};

interface AIChatInterfaceProps {
  projectId: string;
  isAIProcessing?: boolean;
  onRequestProgrammer?: () => void;
}

export function AIChatInterface({ projectId, isAIProcessing = false, onRequestProgrammer }: AIChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [expandedCodeBlocks, setExpandedCodeBlocks] = useState<Set<string>>(new Set());
  const [collaborativeMode, setCollaborativeMode] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Array<{from: string; to: string; message: string}>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<AIChatMessage[]>({
    queryKey: ["/api/projects", projectId, "ai-chat"],
  });

  const { data: aiStatus } = useQuery({
    queryKey: ["/api/ai/status"],
    staleTime: 30000,
  });

  const [agents, setAgents] = useState<Record<AgentType, AgentInfo>>(() => {
    const initial: Record<string, AgentInfo> = {};
    Object.entries(agentConfigs).forEach(([key, config]) => {
      initial[key] = { ...config, status: "idle" };
    });
    return initial as Record<AgentType, AgentInfo>;
  });

  useEffect(() => {
    if (isAIProcessing) {
      const agentTypes: AgentType[] = ["ui_ux", "backend", "database", "qa", "devops"];
      let currentIndex = 0;

      const interval = setInterval(() => {
        setAgents((prev) => {
          const updated = { ...prev };
          
          agentTypes.forEach((type, index) => {
            if (index < currentIndex) {
              updated[type] = { ...updated[type], status: "completed", progress: 100 };
            } else if (index === currentIndex) {
              updated[type] = { 
                ...updated[type], 
                status: "working", 
                progress: Math.min((updated[type].progress || 0) + 10, 100),
                currentTask: getRandomTask(type)
              };
              if (updated[type].progress === 100) {
                currentIndex++;
              }
            } else {
              updated[type] = { ...updated[type], status: "idle", progress: 0 };
            }
          });
          
          return updated;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isAIProcessing]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      await apiRequest("POST", `/api/projects/${projectId}/ai-chat`, {
        content: text,
        collaborative: collaborativeMode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "ai-chat"] });
    },
  });

  // WebSocket listener for agent communication
  useEffect(() => {
    const handleAgentMessage = (event: CustomEvent) => {
      const data = event.detail;
      if (data.type === 'agent:message' && data.projectId === projectId) {
        setAgentMessages(prev => [...prev.slice(-9), data.data]);
      }
    };
    
    window.addEventListener('ws:agent:message' as any, handleAgentMessage as any);
    return () => window.removeEventListener('ws:agent:message' as any, handleAgentMessage as any);
  }, [projectId]);

  const handleSend = () => {
    if (messageText.trim()) {
      sendMessage.mutate(messageText.trim());
      setMessageText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleCodeBlock = (id: string) => {
    setExpandedCodeBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getRandomTask = (type: AgentType): string => {
    const tasks: Record<AgentType, string[]> = {
      ui_ux: ["Creating component layouts", "Styling forms", "Building navigation", "Adding animations"],
      backend: ["Setting up routes", "Creating controllers", "Implementing validation", "Adding middleware"],
      database: ["Designing schema", "Creating migrations", "Optimizing queries", "Setting up indexes"],
      qa: ["Writing unit tests", "Creating integration tests", "Testing edge cases", "Validating outputs"],
      devops: ["Configuring Docker", "Setting up CI/CD", "Preparing deployment", "Configuring environment"],
    };
    return tasks[type][Math.floor(Math.random() * tasks[type].length)];
  };

  const workingAgents = Object.values(agents).filter((a) => a.status === "working");

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div>
              <p className="font-semibold text-sm">AgentForge AI Team</p>
              <p className="text-xs text-muted-foreground">5 agents + human backup ready</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="collaborative-mode"
                    checked={collaborativeMode}
                    onCheckedChange={setCollaborativeMode}
                    data-testid="switch-collaborative-mode"
                  />
                  <Label htmlFor="collaborative-mode" className="text-xs cursor-pointer flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Team Mode
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>When enabled, all 5 agents collaborate on your request</p>
              </TooltipContent>
            </Tooltip>
            
            {onRequestProgrammer && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRequestProgrammer}
                className="border-orange-500/30 text-orange-600"
                data-testid="button-request-human"
              >
                <Hand className="h-4 w-4 mr-2" />
                Human Help
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.values(agents).map((agent) => {
            const Icon = agent.icon;
            return (
              <Tooltip key={agent.type}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border shrink-0 transition-all",
                      agent.status === "working" && "border-primary bg-primary/5",
                      agent.status === "completed" && "border-green-500/30 bg-green-500/5",
                      agent.status === "error" && "border-red-500/30 bg-red-500/5",
                      agent.status === "idle" && "border-muted"
                    )}
                    data-testid={`agent-status-${agent.type}`}
                  >
                    <div className={cn("p-1.5 rounded-md", agent.bgColor)}>
                      <Icon className={cn("h-4 w-4", agent.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{agent.name.split(" ")[0]}</p>
                      <div className="flex items-center gap-1">
                        {agent.status === "working" && (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        )}
                        {agent.status === "completed" && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                        {agent.status === "error" && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                      </div>
                    </div>
                    {agent.status === "working" && agent.progress !== undefined && (
                      <div className="w-12">
                        <Progress value={agent.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{agent.description}</p>
                  {agent.currentTask && <p className="text-xs mt-1">{agent.currentTask}</p>}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {workingAgents.length > 0 && (
        <div className="px-4 py-2 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="absolute inset-0 h-4 w-4 animate-ping opacity-30 rounded-full bg-primary" />
            </div>
            <span className="text-sm font-medium">
              {workingAgents.map(a => a.name.split(" ")[0]).join(", ")} {workingAgents.length === 1 ? "is" : "are"} working...
            </span>
          </div>
          {workingAgents[0]?.currentTask && (
            <p className="text-xs text-muted-foreground mt-1 ml-6 animate-pulse">
              {workingAgents[0].currentTask}
            </p>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Start the conversation with our AI team
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Describe what you want to build or ask questions
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                expandedCodeBlocks={expandedCodeBlocks}
                onToggleCodeBlock={toggleCodeBlock}
              />
            ))
          )}
          
          {sendMessage.isPending && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">AI Team</span>
                  <Badge variant="secondary" size="sm">Processing</Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {agentMessages.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Agent Communication</span>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {agentMessages.slice(-3).map((msg, i) => (
              <div key={i} className="text-xs flex items-center gap-2">
                <Badge variant="outline" size="sm">{msg.from}</Badge>
                <span className="text-muted-foreground">-&gt;</span>
                <Badge variant="outline" size="sm">{msg.to}</Badge>
                <span className="text-muted-foreground truncate">{msg.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={collaborativeMode ? "All 5 agents will collaborate on your request..." : "Describe your requirements or ask questions..."}
            className="min-h-[44px] max-h-[120px] resize-none"
            data-testid="input-ai-chat"
          />
          <div className="flex flex-col gap-1">
            <Button 
              onClick={handleSend} 
              disabled={!messageText.trim() || sendMessage.isPending}
              className="shrink-0"
              data-testid="button-send-ai-message"
            >
              {collaborativeMode ? <Users className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
          {aiStatus?.providers?.ollama?.available && (
            <Badge variant="secondary" size="sm" className="text-xs">
              <Zap className="h-2 w-2 mr-1" />
              Ollama Active
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: AIChatMessage;
  expandedCodeBlocks: Set<string>;
  onToggleCodeBlock: (id: string) => void;
}

function MessageBubble({ message, expandedCodeBlocks, onToggleCodeBlock }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const agent = message.agentType ? agentConfigs[message.agentType] : null;
  const Icon = agent?.icon || Bot;

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")} data-testid={`ai-message-${message.id}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(
          isUser ? "bg-muted" : agent ? agent.bgColor : "bg-primary/10"
        )}>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Icon className={cn("h-4 w-4", agent?.color || "text-primary")} />
          )}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn("flex-1 max-w-[85%]", isUser && "flex flex-col items-end")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser ? "You" : agent?.name || "AI Team"}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className={cn(
          "rounded-lg p-3",
          isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
        )}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          
          {message.metadata?.codeBlocks?.map((block, index) => {
            const blockId = `${message.id}-${index}`;
            const isExpanded = expandedCodeBlocks.has(blockId);
            return (
              <div key={blockId} className="mt-3 border rounded-md overflow-hidden">
                <button
                  onClick={() => onToggleCodeBlock(blockId)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-background/50 text-foreground text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="h-3 w-3" />
                    <span>{block.language}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {isExpanded && (
                  <pre className="p-3 bg-background/80 text-xs overflow-x-auto">
                    <code>{block.code}</code>
                  </pre>
                )}
              </div>
            );
          })}
          
          {message.metadata?.filesCreated && message.metadata.filesCreated.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {message.metadata.filesCreated.map((file) => (
                <Badge key={file} variant="outline" size="sm" className="text-xs">
                  <Code className="h-2 w-2 mr-1" />
                  {file}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
