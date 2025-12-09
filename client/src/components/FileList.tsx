import { 
  FileCode, 
  FileJson, 
  FileType, 
  File as FileIcon,
  CheckCircle,
  Clock,
  Loader2,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { File } from "@shared/schema";

interface FileListProps {
  files: File[];
  onFileClick?: (file: File) => void;
}

const fileTypeIcons: Record<string, React.ElementType> = {
  tsx: FileCode,
  ts: FileCode,
  jsx: FileCode,
  js: FileCode,
  json: FileJson,
  css: FileType,
  html: FileType,
  default: FileIcon,
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  in_progress: { label: "In Progress", icon: Loader2, variant: "default" },
  reviewed: { label: "Reviewed", icon: Eye, variant: "default" },
  completed: { label: "Completed", icon: CheckCircle, variant: "default" },
};

function getFileIcon(filename: string): React.ElementType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return fileTypeIcons[ext] || fileTypeIcons.default;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({ files, onFileClick }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No files generated yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {files.map((file) => {
        const Icon = getFileIcon(file.filename);
        const status = statusConfig[file.status || "pending"];
        const StatusIcon = status.icon;

        return (
          <div
            key={file.id}
            className="group py-3 px-4 flex items-center justify-between hover-elevate cursor-pointer rounded-md"
            onClick={() => onFileClick?.(file)}
            data-testid={`file-item-${file.id}`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{file.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {file.linesCount} lines · {formatFileSize(file.size || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {file.agentType && (
                <Badge variant="outline" size="sm" className="hidden sm:flex">
                  {file.agentType.replace('_', '/')}
                </Badge>
              )}
              <Badge variant={status.variant} size="sm">
                <StatusIcon className={`h-3 w-3 mr-1 ${file.status === "in_progress" ? "animate-spin" : ""}`} />
                {status.label}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="invisible group-hover:visible"
                data-testid={`button-view-file-${file.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
