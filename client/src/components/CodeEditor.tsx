import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  FileCode,
  Save,
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  FolderPlus,
  Trash2,
  X,
  Loader2,
  Check,
  AlertCircle,
  RotateCcw,
  MoreVertical,
  Copy,
  Pencil,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { File as ProjectFile } from "@shared/schema";

import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from "@codemirror/view";
import { EditorState, Extension } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput, bracketMatching, foldGutter, foldKeymap } from "@codemirror/language";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

const languageColors: Record<string, string> = {
  tsx: "text-[#3b82f6]",
  ts: "text-[#3b82f6]",
  jsx: "text-[#f59e0b]",
  js: "text-[#f59e0b]",
  css: "text-[#ec4899]",
  scss: "text-[#ec4899]",
  html: "text-[#f97316]",
  json: "text-[#10b981]",
  md: "text-[#6b7280]",
  yml: "text-[#8b5cf6]",
  yaml: "text-[#8b5cf6]",
  py: "text-[#3b82f6]",
  sql: "text-[#06b6d4]",
  sh: "text-[#10b981]",
  bash: "text-[#10b981]",
  go: "text-[#00add8]",
  rust: "text-[#f97316]",
  java: "text-[#f97316]",
  php: "text-[#8b5cf6]",
  rb: "text-[#ef4444]",
  swift: "text-[#f97316]",
  kt: "text-[#8b5cf6]",
  vue: "text-[#10b981]",
  svelte: "text-[#f97316]",
};

const languageLabels: Record<string, string> = {
  tsx: "TypeScript React",
  ts: "TypeScript",
  jsx: "JavaScript React",
  js: "JavaScript",
  css: "CSS",
  scss: "SCSS",
  html: "HTML",
  json: "JSON",
  md: "Markdown",
  yml: "YAML",
  yaml: "YAML",
  py: "Python",
  sql: "SQL",
  sh: "Shell",
  bash: "Bash",
  go: "Go",
  rust: "Rust",
  java: "Java",
  php: "PHP",
  rb: "Ruby",
  swift: "Swift",
  kt: "Kotlin",
  vue: "Vue",
  svelte: "Svelte",
};

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ext;
}

function getLanguageColor(filename: string): string {
  const lang = getLanguageFromFilename(filename);
  return languageColors[lang] || "text-muted-foreground";
}

function getLanguageExtension(filename: string): Extension | null {
  const ext = getLanguageFromFilename(filename);
  switch (ext) {
    case "js":
    case "jsx":
      return javascript({ jsx: true });
    case "ts":
    case "tsx":
      return javascript({ jsx: true, typescript: true });
    case "html":
    case "htm":
      return html();
    case "css":
    case "scss":
      return css();
    case "json":
      return json();
    case "py":
      return python();
    default:
      return null;
  }
}

interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  path: string;
  file?: ProjectFile;
  children?: FileTreeNode[];
}

function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  
  files.forEach((file) => {
    const parts = file.filename.split("/");
    let current = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const existing = current.find((n) => n.name === part);
      
      if (existing) {
        if (!isLast && existing.children) {
          current = existing.children;
        }
      } else {
        const newNode: FileTreeNode = {
          name: part,
          type: isLast ? "file" : "folder",
          path: parts.slice(0, index + 1).join("/"),
          children: isLast ? undefined : [],
          file: isLast ? file : undefined,
        };
        current.push(newNode);
        if (!isLast && newNode.children) {
          current = newNode.children;
        }
      }
    });
  });
  
  return sortFileTree(root);
}

function sortFileTree(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .map((node) => ({
      ...node,
      children: node.children ? sortFileTree(node.children) : undefined,
    }));
}

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  selectedFile?: ProjectFile;
  expandedFolders: Set<string>;
  onSelectFile: (file: ProjectFile) => void;
  onToggleFolder: (path: string) => void;
  onDeleteFile?: (file: ProjectFile) => void;
}

function FileTreeItem({
  node,
  depth,
  selectedFile,
  expandedFolders,
  onSelectFile,
  onToggleFolder,
  onDeleteFile,
}: FileTreeItemProps) {
  const isFolder = node.type === "folder";
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile?.id === node.file?.id;

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <button
            className={cn(
              "w-full flex items-center gap-1.5 px-2 py-1 text-sm rounded-sm transition-colors",
              isSelected ? "bg-[#2c313a] text-[#abb2bf]" : "text-[#9da5b4] hover:bg-[#2c313a]/50"
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              if (isFolder) {
                onToggleFolder(node.path);
              } else if (node.file) {
                onSelectFile(node.file);
              }
            }}
            data-testid={`file-${node.path.replace(/\//g, "-")}`}
          >
            {isFolder ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 shrink-0 text-[#5c6370]" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0 text-[#5c6370]" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 shrink-0 text-[#e5c07b]" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0 text-[#e5c07b]" />
                )}
              </>
            ) : (
              <>
                <span className="w-3" />
                <FileCode className={cn("h-4 w-4 shrink-0", getLanguageColor(node.name))} />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </button>
        </ContextMenuTrigger>
        {!isFolder && node.file && onDeleteFile && (
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onDeleteFile(node.file!)}>
              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
              Delete File
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
      
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              expandedFolders={expandedFolders}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OpenTab {
  file: ProjectFile;
  content: string;
  isDirty: boolean;
}

interface CodeMirrorEditorProps {
  content: string;
  filename: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

function CodeMirrorEditor({ content, filename, onChange, readOnly = false }: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [cursorInfo, setCursorInfo] = useState({ line: 1, col: 1 });

  const extensions = useMemo(() => {
    const langExtension = getLanguageExtension(filename);
    const baseExtensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        indentWithTab,
      ]),
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
        if (update.selectionSet) {
          const pos = update.state.selection.main.head;
          const line = update.state.doc.lineAt(pos);
          setCursorInfo({
            line: line.number,
            col: pos - line.from + 1,
          });
        }
      }),
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "13px",
        },
        ".cm-content": {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          padding: "8px 0",
        },
        ".cm-gutters": {
          backgroundColor: "transparent",
          border: "none",
          color: "hsl(var(--muted-foreground))",
        },
        ".cm-lineNumbers .cm-gutterElement": {
          padding: "0 12px 0 8px",
          minWidth: "40px",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "hsla(var(--accent), 0.3)",
        },
        ".cm-activeLine": {
          backgroundColor: "hsla(var(--accent), 0.1)",
        },
        ".cm-scroller": {
          overflow: "auto",
        },
        ".cm-focused .cm-cursor": {
          borderLeftColor: "hsl(var(--primary))",
        },
        ".cm-selectionBackground, .cm-content ::selection": {
          backgroundColor: "hsla(var(--primary), 0.3) !important",
        },
      }),
      EditorState.readOnly.of(readOnly),
    ];

    if (langExtension) {
      baseExtensions.push(langExtension);
    }

    return baseExtensions;
  }, [filename, readOnly, onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const state = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [extensions]);

  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== content) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: content,
          },
        });
      }
    }
  }, [content]);

  return (
    <div className="h-full flex flex-col">
      <div 
        ref={containerRef} 
        className="flex-1 overflow-hidden"
        data-testid="code-editor-codemirror"
      />
      <div className="flex items-center justify-end gap-4 px-3 py-1 border-t bg-[#21252b] text-xs text-[#9da5b4]">
        <span>Ln {cursorInfo.line}, Col {cursorInfo.col}</span>
      </div>
    </div>
  );
}

interface CodeEditorProps {
  projectId: string;
  files: ProjectFile[];
  onFileCreate?: (filename: string) => void;
  onFileDelete?: (fileId: string, filename: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({
  projectId,
  files,
  onFileCreate,
  onFileDelete,
  readOnly = false,
}: CodeEditorProps) {
  const { toast } = useToast();
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src", "client", "server"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [newFilename, setNewFilename] = useState("");

  const fileTree = buildFileTree(files);
  
  const filteredFiles = searchQuery
    ? files.filter((f) => f.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  const activeOpenTab = openTabs.find((tab) => tab.file.id === activeTab);

  const saveFile = useMutation({
    mutationFn: async ({ fileId, filename, content }: { fileId: string; filename: string; content: string }) => {
      await apiRequest("POST", `/api/workspace/${projectId}/file`, { 
        path: filename, 
        content 
      });
      await apiRequest("PATCH", `/api/files/${fileId}`, { content });
    },
    onSuccess: (_, { fileId }) => {
      setOpenTabs((tabs) =>
        tabs.map((tab) =>
          tab.file.id === fileId ? { ...tab, isDirty: false } : tab
        )
      );
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      toast({
        title: "File saved",
        description: "Changes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectFile = (file: ProjectFile) => {
    const existing = openTabs.find((tab) => tab.file.id === file.id);
    if (existing) {
      setActiveTab(file.id);
    } else {
      setOpenTabs((tabs) => [
        ...tabs,
        { file, content: file.content || "", isDirty: false },
      ]);
      setActiveTab(file.id);
    }
  };

  const handleCloseTab = (fileId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const tab = openTabs.find((t) => t.file.id === fileId);
    if (tab?.isDirty) {
      if (!confirm("You have unsaved changes. Close anyway?")) {
        return;
      }
    }
    setOpenTabs((tabs) => tabs.filter((t) => t.file.id !== fileId));
    if (activeTab === fileId) {
      const remaining = openTabs.filter((t) => t.file.id !== fileId);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].file.id : null);
    }
  };

  const handleContentChange = useCallback((content: string) => {
    if (!activeTab) return;
    setOpenTabs((tabs) =>
      tabs.map((tab) =>
        tab.file.id === activeTab ? { ...tab, content, isDirty: true } : tab
      )
    );
  }, [activeTab]);

  const handleSave = useCallback(() => {
    if (!activeOpenTab || readOnly) return;
    saveFile.mutate({ 
      fileId: activeOpenTab.file.id, 
      filename: activeOpenTab.file.filename,
      content: activeOpenTab.content 
    });
  }, [activeOpenTab, readOnly, saveFile]);

  const handleToggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleDeleteFile = (file: ProjectFile) => {
    if (!confirm(`Delete ${file.filename}?`)) return;
    handleCloseTab(file.id);
    onFileDelete?.(file.id, file.filename);
  };

  const handleCreateFile = () => {
    if (!newFilename.trim()) return;
    onFileCreate?.(newFilename.trim());
    setNewFilename("");
    setNewFileDialogOpen(false);
  };

  const lineCount = activeOpenTab
    ? activeOpenTab.content.split("\n").length
    : 0;

  const [showMinimap, setShowMinimap] = useState(true);

  const handleRefresh = () => {
    toast({
      title: "Files refreshed",
      description: "File list has been updated.",
    });
  };

  return (
    <div className="flex h-full border rounded-lg overflow-hidden bg-card">
      <div className="w-60 border-r flex flex-col shrink-0 bg-[#21252b]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#181a1f]">
          <span className="text-xs font-semibold uppercase text-[#9da5b4] tracking-wider">Explorer</span>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[#9da5b4] hover:text-white hover:bg-[#3e4451]"
                  onClick={() => setNewFileDialogOpen(true)}
                  data-testid="button-new-file-header"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">New File</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[#9da5b4] hover:text-white hover:bg-[#3e4451]"
                  onClick={() => toast({ title: "New folder", description: "Enter folder path in new file dialog with trailing /" })}
                  data-testid="button-new-folder-header"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">New Folder</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[#9da5b4] hover:text-white hover:bg-[#3e4451]"
                  onClick={handleRefresh}
                  data-testid="button-refresh-files"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Refresh</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="p-2 border-b border-[#181a1f]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5c6370]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-8 h-7 text-sm bg-[#1e2227] border-[#3e4451] text-[#abb2bf] placeholder:text-[#5c6370]"
              data-testid="input-file-search"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1 bg-[#1e2227]">
          <div className="p-1">
            {filteredFiles ? (
              filteredFiles.length === 0 ? (
                <p className="text-xs text-[#5c6370] p-2">No files found</p>
              ) : (
                filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm text-left transition-colors",
                      activeOpenTab?.file.id === file.id ? "bg-[#2c313a] text-[#abb2bf]" : "text-[#9da5b4] hover:bg-[#2c313a]"
                    )}
                    onClick={() => handleSelectFile(file)}
                    data-testid={`search-result-${file.id}`}
                  >
                    <FileCode className={cn("h-4 w-4 shrink-0", getLanguageColor(file.filename))} />
                    <span className="truncate">{file.filename}</span>
                  </button>
                ))
              )
            ) : (
              fileTree.map((node) => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  depth={0}
                  selectedFile={activeOpenTab?.file}
                  expandedFolders={expandedFolders}
                  onSelectFile={handleSelectFile}
                  onToggleFolder={handleToggleFolder}
                  onDeleteFile={!readOnly ? handleDeleteFile : undefined}
                />
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-2 border-t border-[#181a1f] text-[10px] text-[#5c6370]">
          {files.length} files
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {openTabs.length > 0 && (
          <div className="flex items-center border-b shrink-0 bg-[#21252b]">
            <div className="flex-1 overflow-x-auto">
              <div className="flex">
                {openTabs.map((tab) => (
                  <button
                    key={tab.file.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 border-r border-[#181a1f] text-sm min-w-0 shrink-0 transition-colors",
                      activeTab === tab.file.id && "bg-[#282c34] text-white",
                      activeTab !== tab.file.id && "bg-[#21252b] text-[#9da5b4] hover:bg-[#2c313a]"
                    )}
                    onClick={() => setActiveTab(tab.file.id)}
                    data-testid={`tab-${tab.file.id}`}
                  >
                    <FileCode className={cn("h-4 w-4 shrink-0", getLanguageColor(tab.file.filename))} />
                    <span className="truncate max-w-[120px]">
                      {tab.file.filename.split("/").pop()}
                    </span>
                    {tab.isDirty && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    )}
                    <button
                      onClick={(e) => handleCloseTab(tab.file.id, e)}
                      className="p-0.5 rounded hover:bg-[#3e4451] ml-1"
                      data-testid={`close-tab-${tab.file.id}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
            
            {activeOpenTab && (
              <div className="flex items-center gap-0.5 px-2 shrink-0 border-l border-[#181a1f]">
                {!readOnly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleSave}
                        disabled={!activeOpenTab.isDirty || saveFile.isPending}
                        className="h-7 w-7 text-[#9da5b4] hover:text-white hover:bg-[#3e4451]"
                        data-testid="button-save-file"
                      >
                        {saveFile.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save (Ctrl+S)</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowMinimap(!showMinimap)}
                      className={cn(
                        "h-7 w-7 text-[#9da5b4] hover:text-white hover:bg-[#3e4451]",
                        showMinimap && "bg-[#3e4451] text-white"
                      )}
                      data-testid="button-toggle-minimap"
                    >
                      <Map className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle Minimap</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-hidden bg-[#282c34]">
          {activeOpenTab ? (
            <CodeMirrorEditor
              key={activeOpenTab.file.id}
              content={activeOpenTab.content}
              filename={activeOpenTab.file.filename}
              onChange={handleContentChange}
              readOnly={readOnly}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[#5c6370]">
              <div className="text-center">
                <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a file to view</p>
                <p className="text-xs mt-1">or create a new file</p>
              </div>
            </div>
          )}
        </div>

        {activeOpenTab && (
          <div className="flex items-center justify-between gap-4 px-3 py-1.5 border-t bg-[#21252b] text-xs text-[#9da5b4] shrink-0">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-medium text-[#abb2bf]">{activeOpenTab.file.filename}</span>
              <Badge variant="outline" size="sm" className={cn("border-[#3e4451] bg-[#2c313a]", getLanguageColor(activeOpenTab.file.filename))}>
                {languageLabels[getLanguageFromFilename(activeOpenTab.file.filename)] || getLanguageFromFilename(activeOpenTab.file.filename).toUpperCase() || "TXT"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span>{lineCount} lines</span>
              <span>{activeOpenTab.content.length} chars</span>
              {activeOpenTab.isDirty ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  Modified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-400">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={newFileDialogOpen} onOpenChange={setNewFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFilename}
              onChange={(e) => setNewFilename(e.target.value)}
              placeholder="e.g., src/components/Button.tsx"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
              data-testid="input-new-filename"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setNewFileDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFile} disabled={!newFilename.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
