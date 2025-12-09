import { 
  Palette, 
  Server, 
  Database, 
  TestTube, 
  Cloud,
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export type AgentType = "ui_ux" | "backend" | "database" | "qa" | "devops";
export type AgentStatus = "idle" | "running" | "completed" | "failed";

interface AgentCardProps {
  type: AgentType;
  status: AgentStatus;
  progress?: number;
  cost?: string;
  compact?: boolean;
}

const agentConfig: Record<AgentType, { name: string; nameAr: string; icon: React.ElementType; color: string }> = {
  ui_ux: { name: "UI/UX Agent", nameAr: "وكيل الواجهات", icon: Palette, color: "text-pink-500" },
  backend: { name: "Backend Agent", nameAr: "وكيل الخوادم", icon: Server, color: "text-blue-500" },
  database: { name: "Database Agent", nameAr: "وكيل قواعد البيانات", icon: Database, color: "text-green-500" },
  qa: { name: "QA Agent", nameAr: "وكيل الاختبارات", icon: TestTube, color: "text-yellow-500" },
  devops: { name: "DevOps Agent", nameAr: "وكيل النشر", icon: Cloud, color: "text-purple-500" },
};

const statusConfig: Record<AgentStatus, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  idle: { label: "Waiting", icon: Clock, variant: "secondary" },
  running: { label: "Running", icon: Loader2, variant: "default" },
  completed: { label: "Done", icon: CheckCircle, variant: "default" },
  failed: { label: "Failed", icon: XCircle, variant: "destructive" },
};

export function AgentCard({ type, status, progress = 0, cost, compact = false }: AgentCardProps) {
  const agent = agentConfig[type];
  const statusInfo = statusConfig[status];
  const Icon = agent.icon;
  const StatusIcon = statusInfo.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        <Icon className={`h-5 w-5 ${agent.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agent.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusIcon className={`h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />
            <span className="text-xs text-muted-foreground">{statusInfo.label}</span>
          </div>
        </div>
        {status === "running" && (
          <div className="w-16">
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-muted ${agent.color}`}>
          <Icon className="h-8 w-8" />
        </div>
        <Badge variant={statusInfo.variant} size="sm">
          <StatusIcon className={`h-3 w-3 mr-1 ${status === "running" ? "animate-spin" : ""}`} />
          {statusInfo.label}
        </Badge>
      </div>
      <h3 className="text-sm font-medium">{agent.name}</h3>
      <p className="text-xs text-muted-foreground mt-1">{agent.nameAr}</p>
      {status === "running" && (
        <div className="mt-3">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
        </div>
      )}
      {cost && (
        <p className="text-xs text-muted-foreground mt-2">
          Cost: <span className="font-mono">${cost}</span>
        </p>
      )}
    </Card>
  );
}
