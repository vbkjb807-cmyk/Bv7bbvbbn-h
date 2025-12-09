import { 
  Square, 
  Play,
  Monitor, 
  Globe, 
  Terminal, 
  Plus,
  Columns
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ReplitBottomToolbarProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onToggleWebview: () => void;
  onToggleTerminal: () => void;
  onAddPanel: () => void;
  activePanel: "webview" | "terminal" | null;
  isWebviewOpen: boolean;
  isTerminalOpen: boolean;
}

export function ReplitBottomToolbar({
  isRunning,
  onToggleRun,
  onToggleWebview,
  onToggleTerminal,
  onAddPanel,
  activePanel,
  isWebviewOpen,
  isTerminalOpen,
}: ReplitBottomToolbarProps) {
  return (
    <div className="flex items-center justify-center gap-1 py-2 px-4 bg-background border-t">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-lg",
              isRunning ? "bg-green-500 hover:bg-green-600 text-white" : "bg-muted"
            )}
            onClick={onToggleRun}
            data-testid="button-run-stop"
          >
            {isRunning ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isRunning ? "Stop" : "Run"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-lg",
              isWebviewOpen && "bg-muted"
            )}
            onClick={onToggleWebview}
            data-testid="button-webview"
          >
            <Monitor className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Webview</TooltipContent>
      </Tooltip>

      <div className="flex items-center justify-center h-10 w-10">
        <div className="grid grid-cols-2 gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-violet-500" />
          <div className="w-3 h-3 rounded-sm bg-violet-400" />
          <div className="w-3 h-3 rounded-sm bg-violet-400" />
          <div className="w-3 h-3 rounded-sm bg-violet-500" />
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg"
            data-testid="button-web"
          >
            <Globe className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Web</TooltipContent>
      </Tooltip>

      <div className="h-6 w-px bg-border mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-lg",
              isTerminalOpen && "bg-muted"
            )}
            onClick={onToggleTerminal}
            data-testid="button-terminal-toggle"
          >
            <Terminal className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Terminal</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg"
            onClick={onAddPanel}
            data-testid="button-add-panel"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Add Panel</TooltipContent>
      </Tooltip>

      <div className="h-6 w-px bg-border mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg"
            data-testid="button-layout"
          >
            <Columns className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Layout</TooltipContent>
      </Tooltip>
    </div>
  );
}
