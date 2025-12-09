import { useState, useEffect, useCallback, useRef } from "react";
import { getFirebaseToken } from "@/lib/queryClient";

export type WebSocketMessageType =
  | "terminal:output"
  | "terminal:input"
  | "terminal:create"
  | "terminal:created"
  | "terminal:resize"
  | "terminal:destroy"
  | "process:start"
  | "process:stop"
  | "process:output"
  | "process:status"
  | "agent:status"
  | "file:changed"
  | "project:status"
  | "chat:message"
  | "connection:established"
  | "connection:error"
  | "ping"
  | "pong";

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  projectId?: string;
  data: T;
  timestamp: number;
}

export interface TerminalOutputData {
  output: string;
  sessionId?: string;
  isError?: boolean;
  agentType?: string;
}

export interface TerminalCreatedData {
  sessionId: string;
  tabId?: string;
}

export interface ProcessOutputData {
  type: "stdout" | "stderr" | "system";
  data: string;
  timestamp: number;
}

export interface ProcessStatusData {
  id: string;
  projectId: string;
  command: string;
  port?: number;
  status: "starting" | "running" | "stopped" | "error";
  startedAt?: number;
  stoppedAt?: number;
  exitCode?: number;
  error?: string;
}

export interface AgentStatusData {
  agentType: string;
  status: "idle" | "running" | "completed" | "failed";
  progress?: number;
  message?: string;
  result?: string;
}

export interface FileChangedData {
  fileId: string;
  filename: string;
  action: "created" | "updated" | "deleted";
  agentType?: string;
  content?: string;
}

export interface ProjectStatusData {
  projectId: string;
  status: string;
  previousStatus?: string;
  message?: string;
}

export interface ChatMessageData {
  messageId: string;
  senderId: string;
  senderName?: string;
  content: string;
  role: "user" | "assistant" | "system";
  agentType?: string;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseWebSocketOptions {
  projectId?: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onTerminalOutput?: (data: TerminalOutputData) => void;
  onTerminalCreated?: (data: TerminalCreatedData) => void;
  onProcessOutput?: (data: ProcessOutputData) => void;
  onProcessStatus?: (data: ProcessStatusData) => void;
  onAgentStatus?: (data: AgentStatusData) => void;
  onFileChanged?: (data: FileChangedData) => void;
  onProjectStatus?: (data: ProjectStatusData) => void;
  onChatMessage?: (data: ChatMessageData) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: <T>(type: WebSocketMessageType, data: T) => void;
  sendChatMessage: (content: string) => void;
  createTerminal: (tabId: string, cols?: number, rows?: number) => void;
  sendTerminalInput: (sessionId: string, data: string) => void;
  resizeTerminal: (sessionId: string, cols: number, rows: number) => void;
  destroyTerminal: (sessionId: string) => void;
  startProcess: () => void;
  stopProcess: () => void;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
  terminalSessionId: string | null;
  terminalSessionIds: Set<string>;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    projectId,
    autoConnect = true,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onTerminalOutput,
    onTerminalCreated,
    onProcessOutput,
    onProcessStatus,
    onAgentStatus,
    onFileChanged,
    onProjectStatus,
    onChatMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [terminalSessionId, setTerminalSessionId] = useState<string | null>(null);
  const [terminalSessionIds, setTerminalSessionIds] = useState<Set<string>>(new Set());

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimers();
    if (socketRef.current) {
      socketRef.current.close(1000, "Client disconnect");
      socketRef.current = null;
    }
    if (!isUnmountedRef.current) {
      setStatus("disconnected");
    }
  }, [clearTimers]);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = getFirebaseToken();
    if (!token) {
      console.warn("[WebSocket] No auth token available");
      setStatus("error");
      return;
    }

    setStatus("connecting");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const params = new URLSearchParams({ token });
    if (projectId) {
      params.set("projectId", projectId);
    }
    const wsUrl = `${protocol}//${window.location.host}/ws?${params.toString()}`;

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isUnmountedRef.current) return;
        console.log("[WebSocket] Connected");
        setStatus("connected");
        setReconnectAttempts(0);

        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping", data: {}, timestamp: Date.now() }));
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);

          switch (message.type) {
            case "connection:established":
              onConnect?.();
              break;
            case "connection:error":
              console.error("[WebSocket] Connection error:", message.data);
              break;
            case "terminal:output":
              onTerminalOutput?.(message.data as TerminalOutputData);
              break;
            case "terminal:created":
              const createdData = message.data as TerminalCreatedData;
              setTerminalSessionId(createdData.sessionId);
              setTerminalSessionIds((prev) => new Set([...prev, createdData.sessionId]));
              onTerminalCreated?.(createdData);
              break;
            case "process:output":
              onProcessOutput?.(message.data as ProcessOutputData);
              break;
            case "process:status":
              onProcessStatus?.(message.data as ProcessStatusData);
              break;
            case "agent:status":
              onAgentStatus?.(message.data as AgentStatusData);
              break;
            case "file:changed":
              onFileChanged?.(message.data as FileChangedData);
              break;
            case "project:status":
              onProjectStatus?.(message.data as ProjectStatusData);
              break;
            case "chat:message":
              onChatMessage?.(message.data as ChatMessageData);
              break;
            case "pong":
              break;
            default:
              break;
          }
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      socket.onclose = (event) => {
        if (isUnmountedRef.current) return;
        console.log("[WebSocket] Disconnected:", event.code, event.reason);
        clearTimers();
        setStatus("disconnected");
        onDisconnect?.();

        if (reconnect && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttempts);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) {
              setReconnectAttempts((prev) => prev + 1);
              connect();
            }
          }, delay);
        }
      };

      socket.onerror = (error) => {
        if (isUnmountedRef.current) return;
        console.error("[WebSocket] Error:", error);
        setStatus("error");
        onError?.(error);
      };
    } catch (error) {
      console.error("[WebSocket] Failed to create connection:", error);
      setStatus("error");
    }
  }, [
    projectId,
    reconnect,
    reconnectInterval,
    maxReconnectAttempts,
    reconnectAttempts,
    clearTimers,
    onConnect,
    onDisconnect,
    onError,
    onTerminalOutput,
    onTerminalCreated,
    onProcessOutput,
    onProcessStatus,
    onAgentStatus,
    onFileChanged,
    onProjectStatus,
    onChatMessage,
  ]);

  const sendMessage = useCallback(<T,>(type: WebSocketMessageType, data: T) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type,
          projectId,
          data,
          timestamp: Date.now(),
        })
      );
    } else {
      console.warn("[WebSocket] Cannot send message: not connected");
    }
  }, [projectId]);

  const sendChatMessage = useCallback(
    (content: string) => {
      sendMessage("chat:message", { content });
    },
    [sendMessage]
  );

  const createTerminal = useCallback(
    (tabId: string, cols = 80, rows = 24) => {
      sendMessage("terminal:create", { tabId, cols, rows });
    },
    [sendMessage]
  );

  const sendTerminalInput = useCallback(
    (sessionId: string, data: string) => {
      sendMessage("terminal:input", { sessionId, data });
    },
    [sendMessage]
  );

  const resizeTerminal = useCallback(
    (sessionId: string, cols: number, rows: number) => {
      sendMessage("terminal:resize", { sessionId, cols, rows });
    },
    [sendMessage]
  );

  const destroyTerminal = useCallback((sessionId: string) => {
    sendMessage("terminal:destroy", { sessionId });
    setTerminalSessionIds((prev) => {
      const next = new Set(prev);
      next.delete(sessionId);
      return next;
    });
    if (terminalSessionId === sessionId) {
      setTerminalSessionId(null);
    }
  }, [sendMessage, terminalSessionId]);

  const startProcess = useCallback(() => {
    sendMessage("process:start", {});
  }, [sendMessage]);

  const stopProcess = useCallback(() => {
    sendMessage("process:stop", {});
  }, [sendMessage]);

  useEffect(() => {
    isUnmountedRef.current = false;

    if (autoConnect) {
      const timer = setTimeout(connect, 100);
      return () => {
        clearTimeout(timer);
        isUnmountedRef.current = true;
        disconnect();
      };
    }

    return () => {
      isUnmountedRef.current = true;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  useEffect(() => {
    if (status === "connected" && projectId) {
      disconnect();
      const timer = setTimeout(connect, 100);
      return () => clearTimeout(timer);
    }
  }, [projectId]);

  return {
    status,
    isConnected: status === "connected",
    connect,
    disconnect,
    sendMessage,
    sendChatMessage,
    createTerminal,
    sendTerminalInput,
    resizeTerminal,
    destroyTerminal,
    startProcess,
    stopProcess,
    lastMessage,
    reconnectAttempts,
    terminalSessionId,
    terminalSessionIds,
  };
}

export function useProjectWebSocket(
  projectId: string | undefined,
  callbacks?: {
    onTerminalOutput?: (data: TerminalOutputData) => void;
    onTerminalCreated?: (data: TerminalCreatedData) => void;
    onProcessOutput?: (data: ProcessOutputData) => void;
    onProcessStatus?: (data: ProcessStatusData) => void;
    onAgentStatus?: (data: AgentStatusData) => void;
    onFileChanged?: (data: FileChangedData) => void;
    onProjectStatus?: (data: ProjectStatusData) => void;
    onChatMessage?: (data: ChatMessageData) => void;
  }
) {
  return useWebSocket({
    projectId,
    autoConnect: !!projectId,
    ...callbacks,
  });
}
