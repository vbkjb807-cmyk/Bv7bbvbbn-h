import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Globe,
  CheckCircle,
  Loader2,
  FileCode,
  Code,
  AlertCircle,
  Bot,
  User,
  Palette,
  Server,
  Database,
  TestTube,
  Cloud,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type AgentType = "ui_ux" | "backend" | "database" | "qa" | "devops";

interface TaskItem {
  id: string;
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  description?: string;
}

interface TaskSection {
  id: string;
  title: string;
  completedCount: number;
  totalCount: number;
  isRunning?: boolean;
  tasks: TaskItem[];
}

interface CodePayload {
  language: string;
  code: string;
  filename?: string;
}

interface ReplitChatMessageProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentType?: AgentType;
  taskSections?: TaskSection[];
  codePayloads?: CodePayload[];
  filesCreated?: string[];
  createdAt: string;
}

const agentConfigs: Record<AgentType, { name: string; icon: React.ElementType; color: string; bgColor: string }> = {
  ui_ux: { name: "UI/UX Agent", icon: Palette, color: "text-pink-500", bgColor: "bg-pink-500/10" },
  backend: { name: "Backend Agent", icon: Server, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  database: { name: "Database Agent", icon: Database, color: "text-green-500", bgColor: "bg-green-500/10" },
  qa: { name: "QA Agent", icon: TestTube, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  devops: { name: "DevOps Agent", icon: Cloud, color: "text-purple-500", bgColor: "bg-purple-500/10" },
};

function TaskSectionAccordion({ section }: { section: TaskSection }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 py-2 px-1 hover-elevate text-left"
        data-testid={`task-section-${section.id}`}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="flex-1 text-sm font-medium truncate">{section.title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">
            {section.completedCount} / {section.totalCount}
          </span>
          {section.isRunning && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && section.tasks.length > 0 && (
        <div className="pb-2 space-y-1">
          {section.tasks.map((task) => (
            <TaskItemRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskItemRow({ task }: { task: TaskItem }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="pl-6">
      <button
        onClick={() => task.description && setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-left",
          task.description && "hover-elevate cursor-pointer"
        )}
        disabled={!task.description}
        data-testid={`task-item-${task.id}`}
      >
        <div className="shrink-0">
          {task.status === "completed" && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {task.status === "running" && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          {task.status === "pending" && (
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
          )}
          {task.status === "failed" && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        <span className="flex-1 text-sm text-muted-foreground truncate">{task.title}</span>
        {task.description && (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )
        )}
      </button>
      {isExpanded && task.description && (
        <div className="ml-6 mt-1 mb-2 p-2 bg-muted/50 rounded-md text-xs text-muted-foreground">
          {task.description}
        </div>
      )}
    </div>
  );
}

function CodePayloadBlock({ payload }: { payload: CodePayload }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-md overflow-hidden mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 text-xs hover-elevate"
        data-testid={`code-payload-${payload.filename || payload.language}`}
      >
        <div className="flex items-center gap-2">
          <FileCode className="h-3 w-3" />
          <span>{payload.filename || payload.language}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
      {isExpanded && (
        <pre className="p-3 bg-[#1e1e1e] text-xs overflow-x-auto text-[#d4d4d4]">
          <code>{payload.code}</code>
        </pre>
      )}
    </div>
  );
}

export function ReplitChatMessage({
  id,
  role,
  content,
  agentType,
  taskSections,
  codePayloads,
  filesCreated,
  createdAt,
}: ReplitChatMessageProps) {
  const isUser = role === "user";
  const agent = agentType ? agentConfigs[agentType] : null;
  const Icon = agent?.icon || Bot;

  return (
    <div
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
      data-testid={`chat-message-${id}`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            isUser ? "bg-muted" : agent ? agent.bgColor : "bg-violet-500/10"
          )}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Icon className={cn("h-4 w-4", agent?.color || "text-violet-500")} />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex-1 max-w-[90%] min-w-0", isUser && "flex flex-col items-end")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser ? "You" : agent?.name || "Agent"}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div
          className={cn(
            "rounded-lg",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm p-3"
              : "bg-muted/50 rounded-tl-sm"
          )}
        >
          {taskSections && taskSections.length > 0 && (
            <div className="border-b mb-2">
              {taskSections.map((section) => (
                <TaskSectionAccordion key={section.id} section={section} />
              ))}
            </div>
          )}

          {content && (
            <div className={cn("text-sm whitespace-pre-wrap break-words", !isUser && "p-3 pt-0")}>
              {content}
            </div>
          )}

          {codePayloads && codePayloads.length > 0 && (
            <div className="px-3 pb-3">
              {codePayloads.map((payload, index) => (
                <CodePayloadBlock key={index} payload={payload} />
              ))}
            </div>
          )}

          {filesCreated && filesCreated.length > 0 && (
            <div className="px-3 pb-3 flex flex-wrap gap-1">
              {filesCreated.map((file) => (
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

export function ReplitThinkingIndicator({ agentType }: { agentType?: AgentType }) {
  const agent = agentType ? agentConfigs[agentType] : null;
  const Icon = agent?.icon || Bot;

  return (
    <div className="flex gap-3" data-testid="thinking-indicator">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(agent ? agent.bgColor : "bg-violet-500/10")}>
          <Icon className={cn("h-4 w-4", agent?.color || "text-violet-500")} />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{agent?.name || "Agent"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 rounded-lg p-3 rounded-tl-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Thinking...</span>
        </div>
      </div>
    </div>
  );
}

export function ReplitScrollToLatest({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-background border rounded-full shadow-lg text-sm hover-elevate z-50"
      data-testid="button-scroll-to-latest"
    >
      <ChevronDown className="h-3 w-3" />
      Scroll to latest
    </button>
  );
}
