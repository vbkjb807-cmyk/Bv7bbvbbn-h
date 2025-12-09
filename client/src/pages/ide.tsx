import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  Terminal,
  Play,
  Square,
  RotateCcw,
  Maximize2,
  Minimize2,
  Bot,
  Code,
  FileCode,
  Settings,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Search,
  Save,
  Undo2,
  Redo2,
  Copy,
  GitBranch,
  GitCommit,
  Cloud,
  Wifi,
  WifiOff,
  Circle,
  Trash2,
  Plus,
  Zap,
  FolderTree,
  MessageSquare,
  Keyboard,
  Globe,
  RefreshCw,
  Layers,
  Activity,
  Command,
  Monitor,
  Palette,
  Server,
  Database,
  TestTube,
  PanelLeft,
  PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CodeEditor } from "@/components/CodeEditor";
import { AIChatInterface } from "@/components/AIChatInterface";
import { RealTerminal } from "@/components/RealTerminal";
import { ReplitHeader } from "@/components/ReplitHeader";
import { ReplitBottomToolbar } from "@/components/ReplitBottomToolbar";
import { ReplitChatInput } from "@/components/ReplitChatInput";
import { ReplitChatMessage, ReplitThinkingIndicator, ReplitScrollToLatest } from "@/components/ReplitChatMessage";
import { useProjectWebSocket, AgentStatusData, TerminalOutputData, ProcessStatusData, ProcessOutputData } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";
import type { Project, File } from "@shared/schema";

interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "info" | "success";
  content: string;
  timestamp: Date;
}

interface TerminalTab {
  id: string;
  name: string;
  lines: TerminalLine[];
  sessionId?: string;
  outputBuffer: string[];
}

interface AgentStatus {
  type: string;
  name: string;
  icon: React.ElementType;
  color: string;
  status: "idle" | "running" | "completed" | "failed";
  progress: number;
  message?: string;
}

const agentDefaults: Record<string, { name: string; icon: React.ElementType; color: string }> = {
  ui_ux: { name: "UI/UX", icon: Palette, color: "text-pink-500" },
  backend: { name: "Backend", icon: Server, color: "text-blue-500" },
  database: { name: "Database", icon: Database, color: "text-green-500" },
  qa: { name: "QA", icon: TestTube, color: "text-yellow-500" },
  devops: { name: "DevOps", icon: Cloud, color: "text-purple-500" },
};

function ActivityBarButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  testId,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  testId: string;
  badge?: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "relative flex items-center justify-center w-12 h-12 transition-colors",
            isActive
              ? "text-foreground border-l-2 border-primary bg-muted/50"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={onClick}
          data-testid={testId}
        >
          <Icon className="h-5 w-5" />
          {badge !== undefined && badge > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function SimulatedTerminal({ 
  lines, 
  isRunning, 
  onCommand,
  onClear 
}: { 
  lines: TerminalLine[];
  isRunning: boolean;
  onCommand: (command: string) => void;
  onClear: () => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isRunning) {
      onCommand(inputValue);
      setInputValue("");
    }
  };

  return (
    <div 
      className="h-full flex flex-col bg-[#0d1117] text-[#c9d1d9] font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3 space-y-1">
          {lines.map((line) => (
            <div
              key={line.id}
              className={cn(
                "font-mono leading-relaxed whitespace-pre-wrap",
                line.type === "input" && "text-[#79c0ff]",
                line.type === "error" && "text-[#f85149]",
                line.type === "info" && "text-[#7ee787]",
                line.type === "output" && "text-[#c9d1d9]",
                line.type === "success" && "text-[#56d364]"
              )}
            >
              {line.content}
            </div>
          ))}
          {isRunning && (
            <div className="flex items-center gap-2 text-[#7ee787]">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="animate-pulse">Running...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t border-[#30363d] p-2 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <span className="text-[#7ee787] font-bold">$</span>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-[#c9d1d9] placeholder:text-[#484f58]"
            placeholder="Enter command..."
            disabled={isRunning}
            data-testid="terminal-input"
          />
        </div>
      </form>
    </div>
  );
}

function KeyboardShortcutsDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const shortcuts = [
    { category: "General", items: [
      { keys: ["Ctrl", "S"], action: "Save file" },
      { keys: ["Ctrl", "Z"], action: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], action: "Redo" },
      { keys: ["Ctrl", "P"], action: "Quick open file" },
    ]},
    { category: "Editor", items: [
      { keys: ["Ctrl", "F"], action: "Find in file" },
      { keys: ["Ctrl", "H"], action: "Find and replace" },
      { keys: ["Ctrl", "/"], action: "Toggle comment" },
      { keys: ["Alt", "Up/Down"], action: "Move line" },
    ]},
    { category: "Terminal", items: [
      { keys: ["Ctrl", "`"], action: "Toggle terminal" },
      { keys: ["Ctrl", "Shift", "`"], action: "New terminal" },
      { keys: ["Ctrl", "C"], action: "Cancel command" },
    ]},
    { category: "Navigation", items: [
      { keys: ["Ctrl", "B"], action: "Toggle sidebar" },
      { keys: ["Ctrl", "J"], action: "Toggle panel" },
      { keys: ["Ctrl", "\\"], action: "Split editor" },
    ]},
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="grid grid-cols-2 gap-6 p-2">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{section.category}</h3>
                <div className="space-y-2">
                  {section.items.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <span className="text-sm">{shortcut.action}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <span key={i}>
                            <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded font-mono">
                              {key}
                            </kbd>
                            {i < shortcut.keys.length - 1 && <span className="text-muted-foreground mx-0.5">+</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function IDE() {
  const [, params] = useRoute("/ide/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [terminalOpen, setTerminalOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeActivity, setActiveActivity] = useState<"files" | "search" | "git" | "agents">("files");
  const [rightPanelTab, setRightPanelTab] = useState("ai");
  const [previewState, setPreviewState] = useState<"idle" | "starting" | "running" | "error">("idle");
  const [previewKey, setPreviewKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("localhost:5173");
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [currentLanguage, setCurrentLanguage] = useState("TypeScript JSX");

  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projectId = params?.id;

  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([
    {
      id: "main",
      name: "bash",
      lines: [
        { id: "1", type: "info", content: "AgentForge Terminal v2.0 - Powered by 5 AI Agents", timestamp: new Date() },
        { id: "2", type: "info", content: "Type 'help' for available commands", timestamp: new Date() },
      ],
      outputBuffer: [],
    },
  ]);
  const [activeTerminalTab, setActiveTerminalTab] = useState("main");
  const [isTerminalRunning, setIsTerminalRunning] = useState(false);

  const [agents, setAgents] = useState<Record<string, AgentStatus>>(() => {
    const initial: Record<string, AgentStatus> = {};
    Object.entries(agentDefaults).forEach(([key, config]) => {
      initial[key] = { type: key, ...config, status: "idle", progress: 0 };
    });
    return initial;
  });

  const handleTerminalOutput = useCallback((data: TerminalOutputData) => {
    setTerminalTabs((tabs) =>
      tabs.map((tab) =>
        tab.id === activeTerminalTab
          ? {
              ...tab,
              lines: [
                ...tab.lines,
                {
                  id: Date.now().toString(),
                  type: data.isError ? "error" : "output",
                  content: data.output,
                  timestamp: new Date(),
                },
              ],
            }
          : tab
      )
    );
  }, [activeTerminalTab]);

  const handleAgentStatus = useCallback((data: AgentStatusData) => {
    const agentType = data.agentType;
    if (agentDefaults[agentType]) {
      setAgents((prev) => ({
        ...prev,
        [agentType]: {
          ...prev[agentType],
          status: data.status === "running" ? "running" : data.status === "completed" ? "completed" : data.status === "failed" ? "failed" : "idle",
          progress: data.progress || 0,
          message: data.message,
        },
      }));
    }
  }, []);

  const handleProcessOutput = useCallback((data: ProcessOutputData) => {
    setTerminalTabs((tabs) =>
      tabs.map((tab) =>
        tab.id === "process"
          ? {
              ...tab,
              lines: [
                ...tab.lines,
                {
                  id: Date.now().toString(),
                  type: data.type === "stderr" ? "error" : "output",
                  content: data.data,
                  timestamp: new Date(),
                },
              ],
            }
          : tab
      )
    );
  }, []);

  const handleProcessStatus = useCallback((data: ProcessStatusData) => {
    if (data.status === "running" && data.port) {
      setPreviewState("running");
      setPreviewUrl(`localhost:${data.port}`);
    } else if (data.status === "stopped" || data.status === "error") {
      setPreviewState(data.status === "error" ? "error" : "idle");
    } else if (data.status === "starting") {
      setPreviewState("starting");
    }
  }, []);

  const MAX_BUFFER_SIZE = 1000;

  const terminalOutputHandler = useCallback((data: TerminalOutputData) => {
    if (data.output && data.sessionId) {
      setTerminalTabs((tabs) =>
        tabs.map((tab) => {
          if (tab.sessionId === data.sessionId) {
            if (tab.id === activeTerminalTab && (window as any).__writeTerminal) {
              (window as any).__writeTerminal(data.output);
              return tab;
            } else {
              const newBuffer = [...tab.outputBuffer, data.output];
              if (newBuffer.length > MAX_BUFFER_SIZE) {
                newBuffer.splice(0, newBuffer.length - MAX_BUFFER_SIZE);
              }
              return { ...tab, outputBuffer: newBuffer };
            }
          }
          return tab;
        })
      );
    }
  }, [activeTerminalTab]);

  const handleTerminalCreated = useCallback((data: { sessionId: string; tabId?: string }) => {
    if (!data.tabId) return;
    setTerminalTabs((tabs) =>
      tabs.map((t) =>
        t.id === data.tabId ? { ...t, sessionId: data.sessionId } : t
      )
    );
  }, []);

  const { 
    status: wsStatus, 
    isConnected,
    createTerminal,
    sendTerminalInput,
    resizeTerminal,
    destroyTerminal,
    terminalSessionId,
    terminalSessionIds,
    startProcess,
    stopProcess,
  } = useProjectWebSocket(projectId, {
    onTerminalOutput: terminalOutputHandler,
    onTerminalCreated: handleTerminalCreated,
    onAgentStatus: handleAgentStatus,
    onProcessOutput: handleProcessOutput,
    onProcessStatus: handleProcessStatus,
  });

  const prevWsStatus = useRef(wsStatus);
  useEffect(() => {
    if (wsStatus === "disconnected" && prevWsStatus.current === "connected") {
      setTerminalTabs((tabs) =>
        tabs.map((t) => ({ ...t, sessionId: undefined }))
      );
    }
    prevWsStatus.current = wsStatus;
  }, [wsStatus]);

  const getPreviewHtml = (title: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Preview</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container { text-align: center; padding: 2rem; }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; font-weight: 700; }
        p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; }
        .badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.2);
          border-radius: 20px;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        <p>Your application is running successfully!</p>
        <span class="badge">Powered by AgentForge AI</span>
      </div>
    </body>
    </html>
  `;

  const openPreviewInNewTab = () => {
    const html = getPreviewHtml(project?.title || "Your App");
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const startPreview = () => {
    if (previewState === "starting" || previewState === "running") return;
    
    setPreviewState("starting");
    setRightPanelOpen(true);
    setRightPanelTab("preview");
    
    startProcess();
    toast({
      title: "Starting preview",
      description: "Starting the development server...",
    });
  };

  const stopPreview = () => {
    stopProcess();
    setPreviewState("idle");
    toast({
      title: "Preview stopped",
      description: "The development server has been stopped.",
    });
  };

  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
    toast({
      title: "Preview refreshed",
      description: "The preview has been reloaded.",
    });
  };

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<File[]>({
    queryKey: ["/api/projects", projectId, "files"],
    enabled: !!projectId,
  });

  useEffect(() => {
    if (projectId && project) {
      apiRequest("POST", `/api/workspace/${projectId}/init`).catch(() => {
      });
    }
  }, [projectId, project]);

  const createFile = useMutation({
    mutationFn: async (filename: string) => {
      await apiRequest("POST", `/api/projects/${projectId}/files`, {
        filename,
        content: "",
        status: "draft",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      toast({ title: "File created", description: "New file has been created successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteFile = useMutation({
    mutationFn: async ({ fileId, filename }: { fileId: string; filename: string }) => {
      await apiRequest("DELETE", `/api/workspace/${projectId}/file?path=${encodeURIComponent(filename)}`);
      await apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      toast({ title: "File deleted", description: "File has been deleted successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addLine = useCallback((type: TerminalLine["type"], content: string) => {
    setTerminalTabs((tabs) =>
      tabs.map((tab) =>
        tab.id === activeTerminalTab
          ? {
              ...tab,
              lines: [...tab.lines, { id: Date.now().toString(), type, content, timestamp: new Date() }],
            }
          : tab
      )
    );
  }, [activeTerminalTab]);

  const simulateProgress = async (outputs: string[]) => {
    for (const output of outputs) {
      await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));
      addLine("output", output);
    }
  };

  const handleCommand = async (command: string) => {
    addLine("input", `$ ${command}`);
    const cmd = command.trim().toLowerCase();

    if (cmd === "help") {
      addLine("output", "Available commands:");
      addLine("output", "  npm install  - Install dependencies");
      addLine("output", "  npm run dev  - Start development server");
      addLine("output", "  npm test     - Run tests");
      addLine("output", "  npm build    - Build for production");
      addLine("output", "  clear        - Clear terminal");
      addLine("output", "  ls           - List files");
    } else if (cmd === "clear") {
      setTerminalTabs((tabs) =>
        tabs.map((tab) => (tab.id === activeTerminalTab ? { ...tab, lines: [] } : tab))
      );
    } else if (cmd === "ls") {
      addLine("output", "src/");
      addLine("output", "  components/");
      addLine("output", "  pages/");
      addLine("output", "  App.tsx");
      addLine("output", "package.json");
      addLine("output", "tsconfig.json");
    } else if (cmd.startsWith("npm install") || cmd === "npm i") {
      setIsTerminalRunning(true);
      addLine("info", "Installing dependencies...");
      await simulateProgress([
        "added 150 packages in 3s",
        "120 packages are looking for funding",
        "run `npm fund` for details",
      ]);
      addLine("output", "Done!");
      setIsTerminalRunning(false);
    } else if (cmd === "npm run dev") {
      setIsTerminalRunning(true);
      addLine("info", "Starting development server...");
      await simulateProgress([
        "VITE v5.0.0  ready in 300 ms",
        "  -> Local:   http://localhost:5173/",
        "  -> Network: http://192.168.1.100:5173/",
        "",
        "Server running at http://localhost:5173",
      ]);
      setIsTerminalRunning(false);
      startPreview();
    } else if (cmd === "npm test") {
      setIsTerminalRunning(true);
      addLine("info", "Running tests...");
      await simulateProgress([
        "PASS  src/App.test.tsx",
        "PASS  src/components/Button.test.tsx",
        "",
        "Test Suites: 2 passed, 2 total",
        "Tests:       5 passed, 5 total",
        "Time:        1.5s",
      ]);
      setIsTerminalRunning(false);
    } else if (cmd === "npm build" || cmd === "npm run build") {
      setIsTerminalRunning(true);
      addLine("info", "Building for production...");
      await simulateProgress([
        "vite v5.0.0 building for production...",
        "transforming...",
        "rendering chunks...",
        "computing gzip size...",
        "",
        "dist/index.html    0.45 kB | gzip:  0.30 kB",
        "dist/assets/index.js  145.23 kB | gzip: 46.12 kB",
        "dist/assets/index.css   12.45 kB | gzip:  3.21 kB",
        "",
        "Build completed in 2.3s",
      ]);
      setIsTerminalRunning(false);
    } else if (cmd) {
      addLine("error", `Command not found: ${command}`);
      addLine("info", "Type 'help' for available commands");
    }
  };

  const handleClearTerminal = () => {
    setTerminalTabs((tabs) =>
      tabs.map((tab) => (tab.id === activeTerminalTab ? { ...tab, lines: [] } : tab))
    );
  };

  const addNewTerminal = () => {
    const newId = `terminal-${Date.now()}`;
    setTerminalTabs((tabs) => [
      ...tabs,
      {
        id: newId,
        name: `bash (${tabs.length + 1})`,
        lines: [{ id: "1", type: "info", content: "New terminal session", timestamp: new Date() }],
        outputBuffer: [],
      },
    ]);
    setActiveTerminalTab(newId);
  };

  const closeTerminalTab = (tabId: string) => {
    if (terminalTabs.length === 1) return;
    const tab = terminalTabs.find((t) => t.id === tabId);
    if (tab?.sessionId) {
      destroyTerminal(tab.sessionId);
    }
    setTerminalTabs((tabs) => tabs.filter((t) => t.id !== tabId));
    if (activeTerminalTab === tabId) {
      setActiveTerminalTab(terminalTabs[0].id === tabId ? terminalTabs[1].id : terminalTabs[0].id);
    }
  };

  const activeTerminal = terminalTabs.find((t) => t.id === activeTerminalTab) || terminalTabs[0];
  const workingAgentsCount = Object.values(agents).filter((a) => a.status === "running").length;

  if (projectLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <ReplitHeader
        projectTitle={project.title}
        onNewFile={() => {
          const filename = prompt("Enter new file name:");
          if (filename) createFile.mutate(filename);
        }}
        onSettings={() => setKeyboardShortcutsOpen(true)}
        onBack={() => setLocation(`/projects/${projectId}`)}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-12 border-r bg-muted/30 flex flex-col items-center py-2 shrink-0">
          <ActivityBarButton
            icon={FolderTree}
            label="Explorer"
            isActive={activeActivity === "files" && sidebarOpen}
            onClick={() => {
              setSidebarOpen(true);
              setActiveActivity("files");
            }}
            testId="activity-files"
          />
          <ActivityBarButton
            icon={Search}
            label="Search"
            isActive={activeActivity === "search" && sidebarOpen}
            onClick={() => {
              setSidebarOpen(true);
              setActiveActivity("search");
            }}
            testId="activity-search"
          />
          <ActivityBarButton
            icon={GitBranch}
            label="Source Control"
            isActive={activeActivity === "git" && sidebarOpen}
            onClick={() => {
              setSidebarOpen(true);
              setActiveActivity("git");
            }}
            testId="activity-git"
          />
          <ActivityBarButton
            icon={Layers}
            label="AI Agents"
            isActive={activeActivity === "agents" && sidebarOpen}
            onClick={() => {
              setSidebarOpen(true);
              setActiveActivity("agents");
            }}
            testId="activity-agents"
            badge={workingAgentsCount}
          />

          <div className="flex-1" />

          <ActivityBarButton
            icon={Bot}
            label="AI Assistant"
            isActive={rightPanelOpen && rightPanelTab === "ai"}
            onClick={() => {
              setRightPanelOpen(true);
              setRightPanelTab("ai");
            }}
            testId="activity-ai-assistant"
          />
        </div>

        <ResizablePanelGroup direction="horizontal">
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                <div className="h-full border-r bg-card flex flex-col">
                  <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      {activeActivity === "files" && "Explorer"}
                      {activeActivity === "search" && "Search"}
                      {activeActivity === "git" && "Source Control"}
                      {activeActivity === "agents" && "AI Agents"}
                    </span>
                  </div>

                  <ScrollArea className="flex-1">
                    {activeActivity === "files" && (
                      <div className="p-1">
                        {filesLoading ? (
                          <div className="p-4 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        ) : (
                          <CodeEditor
                            projectId={projectId!}
                            files={files}
                            onFileCreate={(filename) => createFile.mutate(filename)}
                            onFileDelete={(fileId, filename) => deleteFile.mutate({ fileId, filename })}
                          />
                        )}
                      </div>
                    )}

                    {activeActivity === "search" && (
                      <div className="p-3">
                        <Input placeholder="Search files..." className="h-8 text-sm" data-testid="input-global-search" />
                        <p className="text-xs text-muted-foreground mt-3">Enter a search term above</p>
                      </div>
                    )}

                    {activeActivity === "git" && (
                      <div className="p-3 space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                          <GitBranch className="h-4 w-4" />
                          <span className="font-medium">main</span>
                          <Badge variant="secondary" size="sm">default</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">No uncommitted changes</div>
                      </div>
                    )}

                    {activeActivity === "agents" && (
                      <div className="p-3 space-y-3">
                        {Object.values(agents).map((agent) => {
                          const Icon = agent.icon;
                          return (
                            <div
                              key={agent.type}
                              className={cn(
                                "p-3 rounded-lg border transition-all",
                                agent.status === "running" && "border-primary bg-primary/5",
                                agent.status === "completed" && "border-green-500/30 bg-green-500/5",
                                agent.status === "failed" && "border-red-500/30 bg-red-500/5",
                                agent.status === "idle" && "border-muted"
                              )}
                              data-testid={`sidebar-agent-${agent.type}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-md bg-muted", agent.status === "running" && "animate-pulse")}>
                                  <Icon className={cn("h-4 w-4", agent.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium">{agent.name}</span>
                                    {agent.status === "running" && (
                                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                    )}
                                    {agent.status === "completed" && (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    )}
                                    {agent.status === "failed" && (
                                      <AlertCircle className="h-3 w-3 text-red-500" />
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                                </div>
                              </div>
                              {agent.status === "running" && (
                                <Progress value={agent.progress} className="h-1 mt-2" />
                              )}
                              {agent.message && (
                                <p className="text-xs text-muted-foreground mt-2 truncate">{agent.message}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          <ResizablePanel defaultSize={rightPanelOpen ? 50 : 80} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={terminalOpen ? 70 : 100} minSize={30}>
                {filesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : activeActivity !== "files" ? (
                  <div className="h-full">
                    <CodeEditor
                      projectId={projectId!}
                      files={files}
                      onFileCreate={(filename) => createFile.mutate(filename)}
                      onFileDelete={(fileId, filename) => deleteFile.mutate({ fileId, filename })}
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted/20">
                    <div className="text-center p-8">
                      <Code className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">Select a file to edit</p>
                      <p className="text-sm text-muted-foreground">
                        Choose a file from the explorer or create a new one
                      </p>
                    </div>
                  </div>
                )}
              </ResizablePanel>

              {terminalOpen && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={30} minSize={15}>
                    <div className="h-full flex flex-col border-t">
                      <div className="flex items-center justify-between px-2 py-1 bg-muted/50 border-b shrink-0">
                        <div className="flex items-center gap-1">
                          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="flex items-center">
                            {terminalTabs.map((tab) => (
                              <button
                                key={tab.id}
                                className={cn(
                                  "flex items-center gap-1.5 px-2 py-1 text-xs rounded-sm transition-colors",
                                  activeTerminalTab === tab.id
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setActiveTerminalTab(tab.id)}
                                data-testid={`terminal-tab-${tab.id}`}
                              >
                                <span>{tab.name}</span>
                                {terminalTabs.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      closeTerminalTab(tab.id);
                                    }}
                                    className="p-0.5 rounded hover:bg-muted-foreground/20"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={addNewTerminal}
                                data-testid="button-new-terminal"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">New Terminal</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleClearTerminal}
                                data-testid="button-clear-terminal"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">Clear Terminal</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setTerminalOpen(false)}
                                data-testid="button-close-terminal"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">Close Panel</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden relative">
                        <RealTerminal
                          key={activeTerminalTab}
                          projectId={projectId!}
                          tabId={activeTerminalTab}
                          isConnected={isConnected}
                          createTerminal={createTerminal}
                          sendTerminalInput={sendTerminalInput}
                          resizeTerminal={resizeTerminal}
                          terminalSessionId={activeTerminal.sessionId || null}
                          initialBuffer={activeTerminal.outputBuffer}
                          onBufferFlushed={() => {
                            setTerminalTabs((tabs) =>
                              tabs.map((t) =>
                                t.id === activeTerminalTab ? { ...t, outputBuffer: [] } : t
                              )
                            );
                          }}
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {rightPanelOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full flex flex-col border-l">
                  <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="h-full flex flex-col">
                    <div className="border-b px-2 shrink-0">
                      <TabsList className="h-10">
                        <TabsTrigger value="ai" className="gap-1.5 text-xs" data-testid="tab-ai-assistant">
                          <Bot className="h-3.5 w-3.5" />
                          AI Assistant
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="gap-1.5 text-xs" data-testid="tab-preview">
                          <Monitor className="h-3.5 w-3.5" />
                          Preview
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="ai" className="flex-1 m-0 overflow-hidden">
                      <div className="h-full">
                        <AIChatInterface projectId={projectId!} />
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
                      <div className="h-full flex flex-col">
                        {previewState === "running" && (
                          <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 shrink-0">
                            <div className="flex items-center gap-2 flex-1 bg-background rounded-md px-3 py-1.5 border">
                              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                value={previewUrl}
                                onChange={(e) => setPreviewUrl(e.target.value)}
                                className="h-6 text-xs border-0 p-0 focus-visible:ring-0"
                                data-testid="input-preview-url"
                              />
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={refreshPreview}
                                  data-testid="button-refresh-preview"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Refresh</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={openPreviewInNewTab}
                                  data-testid="button-open-external"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open in new tab</TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                          {previewState === "idle" && (
                            <div className="h-full flex items-center justify-center bg-muted/30">
                              <div className="text-center p-6">
                                <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-sm font-medium mb-2">Live Preview</p>
                                <p className="text-xs text-muted-foreground mb-4">
                                  Run the project to see the preview
                                </p>
                                <Button size="sm" onClick={startPreview} data-testid="button-start-preview">
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Preview
                                </Button>
                              </div>
                            </div>
                          )}
                          {previewState === "starting" && (
                            <div className="h-full flex items-center justify-center bg-muted/30">
                              <div className="text-center p-6">
                                <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                                <p className="text-sm font-medium mb-2">Starting Preview</p>
                                <p className="text-xs text-muted-foreground">
                                  Building and starting the development server...
                                </p>
                              </div>
                            </div>
                          )}
                          {previewState === "running" && (
                            <iframe
                              key={previewKey}
                              src="about:blank"
                              className="w-full h-full border-0 bg-white"
                              title="Preview"
                              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                              srcDoc={getPreviewHtml(project?.title || "Your App")}
                              data-testid="preview-iframe"
                            />
                          )}
                          {previewState === "error" && (
                            <div className="h-full flex items-center justify-center bg-muted/30">
                              <div className="text-center p-6">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                                <p className="text-sm font-medium mb-2">Preview Error</p>
                                <p className="text-xs text-muted-foreground mb-4">
                                  Failed to start the development server
                                </p>
                                <Button size="sm" variant="outline" onClick={startPreview} data-testid="button-retry-preview">
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Retry
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      <ReplitBottomToolbar
        isRunning={previewState === "running"}
        onToggleRun={() => {
          if (previewState === "running") {
            stopPreview();
          } else {
            startPreview();
          }
        }}
        onToggleWebview={() => {
          setRightPanelOpen(true);
          setRightPanelTab("preview");
        }}
        onToggleTerminal={() => setTerminalOpen(!terminalOpen)}
        onAddPanel={addNewTerminal}
        activePanel={terminalOpen ? "terminal" : rightPanelTab === "preview" && rightPanelOpen ? "webview" : null}
        isWebviewOpen={rightPanelOpen && rightPanelTab === "preview"}
        isTerminalOpen={terminalOpen}
      />

      <KeyboardShortcutsDialog open={keyboardShortcutsOpen} onOpenChange={setKeyboardShortcutsOpen} />
    </div>
  );
}
