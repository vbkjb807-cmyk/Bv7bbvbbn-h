import { 
  ArrowLeft, 
  ArrowRight, 
  History, 
  FilePlus, 
  MoreVertical,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

interface ReplitHeaderProps {
  projectTitle?: string;
  onNewFile?: () => void;
  onSettings?: () => void;
  onBack?: () => void;
}

export function ReplitHeader({
  projectTitle = "Agent",
  onNewFile,
  onSettings,
  onBack,
}: ReplitHeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setLocation("/projects");
    }
  };

  return (
    <header className="flex items-center justify-between h-12 px-2 border-b bg-background">
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Back</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              data-testid="button-history"
            >
              <History className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">History</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <div className="grid grid-cols-2 gap-0.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
          <div className="w-2.5 h-2.5 rounded-sm bg-violet-400" />
          <div className="w-2.5 h-2.5 rounded-sm bg-violet-400" />
          <div className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
        </div>
        <span className="font-semibold text-sm">{projectTitle}</span>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onNewFile}
              data-testid="button-new-file"
            >
              <FilePlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">New File</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              data-testid="button-menu"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onNewFile}>
              <FilePlus className="h-4 w-4 mr-2" />
              New File
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSettings}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleBack}>
              Exit IDE
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
