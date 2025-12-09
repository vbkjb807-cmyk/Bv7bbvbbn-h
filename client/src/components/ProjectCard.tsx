import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Bot,
  Loader2,
  ArrowRight
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-muted", icon: Clock },
  ai_processing: { label: "AI Processing", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: Bot },
  ai_completed: { label: "AI Completed", color: "bg-green-500/10 text-green-600 dark:text-green-400", icon: CheckCircle },
  ai_failed: { label: "AI Failed", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: AlertCircle },
  human_assigned: { label: "Programmer Assigned", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", icon: User },
  in_progress: { label: "In Progress", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", icon: Loader2 },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-600 dark:text-green-400", icon: CheckCircle },
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = statusConfig[project.status || "pending"];
  const StatusIcon = status.icon;
  const budgetNum = parseFloat(project.budget || "0");
  const spentNum = parseFloat(project.spent || "0");
  const progressPercent = budgetNum > 0 ? Math.min((spentNum / budgetNum) * 100, 100) : 0;

  return (
    <Card className="hover-elevate cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate" data-testid={`text-project-title-${project.id}`}>
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {project.description}
          </p>
        </div>
        <Badge className={`${status.color} shrink-0`} size="sm">
          <StatusIcon className={`h-3 w-3 mr-1 ${project.status === "in_progress" || project.status === "ai_processing" ? "animate-spin" : ""}`} />
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Budget Used</span>
              <span className="font-mono">${spentNum.toFixed(2)} / ${budgetNum.toFixed(2)}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-2 pt-2">
        <span className="text-xs text-muted-foreground">
          {new Date(project.createdAt || Date.now()).toLocaleDateString()}
        </span>
        <Button variant="ghost" size="sm" data-testid={`button-view-project-${project.id}`}>
          View Details
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
