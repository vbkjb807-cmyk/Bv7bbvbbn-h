import { useState, useRef } from "react";
import { 
  ChevronUp,
  Paperclip,
  Mic,
  Zap,
  Settings2,
  ArrowUp,
  Hammer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ReplitChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onVoice?: () => void;
  onQuickAction?: () => void;
  onSettings?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  mode?: "build" | "chat" | "debug";
  onModeChange?: (mode: "build" | "chat" | "debug") => void;
}

export function ReplitChatInput({
  value,
  onChange,
  onSend,
  onAttach,
  onVoice,
  onQuickAction,
  onSettings,
  placeholder = "Make, test, iterate...",
  isLoading = false,
  mode = "build",
  onModeChange,
}: ReplitChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSend();
      }
    }
  };

  const modeIcons = {
    build: Hammer,
    chat: null,
    debug: Zap,
  };

  const modeLabels = {
    build: "Build",
    chat: "Chat",
    debug: "Debug",
  };

  return (
    <div className="border-t bg-background">
      <div className="px-4 py-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base p-0"
          data-testid="input-replit-chat"
        />
      </div>
      
      <div className="flex items-center justify-between px-3 py-2 border-t">
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-full"
                data-testid="button-mode-select"
              >
                <Hammer className="h-4 w-4" />
                <span className="text-sm">{modeLabels[mode]}</span>
                <ChevronUp className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onModeChange?.("build")}>
                <Hammer className="h-4 w-4 mr-2" />
                Build
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onModeChange?.("chat")}>
                Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onModeChange?.("debug")}>
                <Zap className="h-4 w-4 mr-2" />
                Debug
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onAttach}
                data-testid="button-attach"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Attach file</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onVoice}
                data-testid="button-voice"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Voice input</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onQuickAction}
                data-testid="button-quick-action"
              >
                <Zap className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Quick actions</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onSettings}
                data-testid="button-chat-settings"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full",
                  !value.trim() && "opacity-50"
                )}
                onClick={onSend}
                disabled={!value.trim() || isLoading}
                data-testid="button-send-message"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Send</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
