import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import { verifyFirebaseIdToken } from "./firebaseAdmin";
import { storage } from "./storage";
import { log } from "./index";
import { terminalService } from "./terminalService";
import { processManager } from "./processManager";

export type WebSocketMessageType =
  | "terminal:output"
  | "terminal:input"
  | "terminal:resize"
  | "terminal:create"
  | "terminal:destroy"
  | "terminal:created"
  | "process:output"
  | "process:status"
  | "process:start"
  | "process:stop"
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
  isError?: boolean;
  agentType?: string;
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

export interface TerminalInputData {
  sessionId: string;
  data: string;
}

export interface TerminalResizeData {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface TerminalCreateData {
  cols?: number;
  rows?: number;
  tabId?: string;
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  projectId?: string;
  terminalSessionIds: Set<string>;
  isAlive?: boolean;
  lastActivity?: number;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private projectConnections: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private userConnections: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      try {
        await this.handleConnection(ws, req);
      } catch (error) {
        log(`WebSocket connection error: ${error}`, "websocket");
        ws.close(4001, "Authentication failed");
      }
    });

    this.wss.on("error", (error) => {
      log(`WebSocket server error: ${error}`, "websocket");
    });

    this.startHeartbeat();
    this.startCleanup();
    this.initializeCallbacks();

    log("WebSocket server initialized on /ws", "websocket");
  }

  private async handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage): Promise<void> {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const projectId = url.searchParams.get("projectId");

    if (!token) {
      this.sendMessage(ws, {
        type: "connection:error",
        data: { message: "Authentication token required" },
        timestamp: Date.now(),
      });
      ws.close(4001, "Token required");
      return;
    }

    const authResult = await verifyFirebaseIdToken(token);
    if (!authResult.valid || !authResult.uid) {
      this.sendMessage(ws, {
        type: "connection:error",
        data: { message: "Invalid authentication token" },
        timestamp: Date.now(),
      });
      ws.close(4002, "Invalid token");
      return;
    }

    const user = await storage.getUserByFirebaseUid(authResult.uid);
    if (!user) {
      this.sendMessage(ws, {
        type: "connection:error",
        data: { message: "User not found" },
        timestamp: Date.now(),
      });
      ws.close(4003, "User not found");
      return;
    }

    ws.userId = user.id;
    ws.projectId = projectId || undefined;
    ws.terminalSessionIds = new Set();
    ws.isAlive = true;
    ws.lastActivity = Date.now();

    this.addUserConnection(user.id, ws);
    if (projectId) {
      const hasAccess = await this.verifyProjectAccess(user.id, projectId);
      if (hasAccess) {
        this.addProjectConnection(projectId, ws);
      } else {
        log(`User ${user.id} denied access to project ${projectId}`, "websocket");
      }
    }

    this.sendMessage(ws, {
      type: "connection:established",
      projectId: projectId || undefined,
      data: {
        userId: user.id,
        username: user.username,
        projectId: projectId || null,
        connectedAt: Date.now(),
      },
      timestamp: Date.now(),
    });

    log(`WebSocket connected: user=${user.id}, project=${projectId || "none"}`, "websocket");

    ws.on("message", (data) => this.handleMessage(ws, data));
    ws.on("close", () => this.handleClose(ws));
    ws.on("error", (error) => this.handleError(ws, error));
    ws.on("pong", () => {
      ws.isAlive = true;
      ws.lastActivity = Date.now();
    });
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer | ArrayBuffer | Buffer[]): void {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage;
      ws.lastActivity = Date.now();

      switch (message.type) {
        case "ping":
          this.sendMessage(ws, {
            type: "pong",
            data: {},
            timestamp: Date.now(),
          });
          break;

        case "chat:message":
          if (ws.projectId) {
            this.broadcastToProject(ws.projectId, message, ws);
          }
          break;

        case "terminal:create":
          this.handleTerminalCreate(ws, message.data as TerminalCreateData);
          break;

        case "terminal:input":
          this.handleTerminalInput(ws, message.data as TerminalInputData);
          break;

        case "terminal:resize":
          this.handleTerminalResize(ws, message.data as TerminalResizeData);
          break;

        case "terminal:destroy":
          const destroyData = message.data as { sessionId?: string };
          this.handleTerminalDestroy(ws, destroyData?.sessionId);
          break;

        case "process:start":
          this.handleProcessStart(ws);
          break;

        case "process:stop":
          this.handleProcessStop(ws);
          break;

        default:
          break;
      }
    } catch (error) {
      log(`Failed to parse WebSocket message: ${error}`, "websocket");
    }
  }

  private handleTerminalCreate(ws: AuthenticatedWebSocket, data: TerminalCreateData): void {
    if (!ws.projectId) {
      log("Cannot create terminal: no project associated with connection", "websocket");
      return;
    }

    try {
      const sessionId = terminalService.createSession(
        ws.projectId,
        data.cols || 80,
        data.rows || 24
      );

      ws.terminalSessionIds.add(sessionId);

      this.sendMessage(ws, {
        type: "terminal:created",
        projectId: ws.projectId,
        data: { sessionId, tabId: data.tabId },
        timestamp: Date.now(),
      });

      log(`Terminal created for project ${ws.projectId}: ${sessionId} tabId=${data.tabId} (total: ${ws.terminalSessionIds.size})`, "websocket");
    } catch (error) {
      log(`Failed to create terminal: ${error}`, "websocket");
    }
  }

  private handleTerminalInput(ws: AuthenticatedWebSocket, data: TerminalInputData): void {
    const sessionId = data.sessionId;
    if (!sessionId || !ws.terminalSessionIds.has(sessionId)) {
      log("Cannot send terminal input: invalid session", "websocket");
      return;
    }

    try {
      terminalService.write(sessionId, data.data);
    } catch (error) {
      log(`Failed to write to terminal: ${error}`, "websocket");
    }
  }

  private handleTerminalResize(ws: AuthenticatedWebSocket, data: TerminalResizeData): void {
    const sessionId = data.sessionId;
    if (!sessionId || !ws.terminalSessionIds.has(sessionId)) {
      return;
    }

    try {
      terminalService.resize(sessionId, data.cols, data.rows);
    } catch (error) {
      log(`Failed to resize terminal: ${error}`, "websocket");
    }
  }

  private handleTerminalDestroy(ws: AuthenticatedWebSocket, sessionId?: string): void {
    if (sessionId && ws.terminalSessionIds.has(sessionId)) {
      terminalService.destroySession(sessionId);
      ws.terminalSessionIds.delete(sessionId);
      log(`Terminal destroyed: ${sessionId} (remaining: ${ws.terminalSessionIds.size})`, "websocket");
    }
  }

  private async handleProcessStart(ws: AuthenticatedWebSocket): Promise<void> {
    if (!ws.projectId) {
      log("Cannot start process: no project associated", "websocket");
      return;
    }

    try {
      const info = await processManager.startDevServer(ws.projectId);
      this.sendProcessStatus(ws.projectId, {
        id: info.id,
        projectId: info.projectId,
        command: info.command,
        port: info.port,
        status: info.status,
        startedAt: info.startedAt?.getTime(),
      });
    } catch (error: any) {
      log(`Failed to start process: ${error.message}`, "websocket");
      this.sendProcessOutput(ws.projectId, {
        type: "system",
        data: `Failed to start: ${error.message}\n`,
        timestamp: Date.now(),
      });
    }
  }

  private async handleProcessStop(ws: AuthenticatedWebSocket): Promise<void> {
    if (!ws.projectId) {
      return;
    }

    try {
      await processManager.stopProcess(ws.projectId);
    } catch (error) {
      log(`Failed to stop process: ${error}`, "websocket");
    }
  }

  private handleClose(ws: AuthenticatedWebSocket): void {
    if (ws.terminalSessionIds && ws.terminalSessionIds.size > 0) {
      log(`Cleaning up ${ws.terminalSessionIds.size} terminal sessions`, "websocket");
      for (const sessionId of ws.terminalSessionIds) {
        terminalService.destroySession(sessionId);
      }
      ws.terminalSessionIds.clear();
    }
    if (ws.userId) {
      this.removeUserConnection(ws.userId, ws);
    }
    if (ws.projectId) {
      this.removeProjectConnection(ws.projectId, ws);
    }
    log(`WebSocket disconnected: user=${ws.userId || "unknown"}`, "websocket");
  }

  private handleError(ws: AuthenticatedWebSocket, error: Error): void {
    log(`WebSocket error for user ${ws.userId}: ${error.message}`, "websocket");
  }

  private async verifyProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const project = await storage.getProject(projectId);
      if (!project) return false;

      if (project.userId === userId) return true;

      const user = await storage.getUser(userId);
      if (user?.role === "programmer") {
        const programmer = await storage.getProgrammerByUserId(userId);
        if (programmer && project.programmerId === programmer.id) return true;
      }

      if (user?.role === "admin") return true;

      return false;
    } catch (error) {
      log(`Error verifying project access: ${error}`, "websocket");
      return false;
    }
  }

  private addProjectConnection(projectId: string, ws: AuthenticatedWebSocket): void {
    if (!this.projectConnections.has(projectId)) {
      this.projectConnections.set(projectId, new Set());
    }
    this.projectConnections.get(projectId)!.add(ws);
  }

  private removeProjectConnection(projectId: string, ws: AuthenticatedWebSocket): void {
    const connections = this.projectConnections.get(projectId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.projectConnections.delete(projectId);
      }
    }
  }

  private addUserConnection(userId: string, ws: AuthenticatedWebSocket): void {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(ws);
  }

  private removeUserConnection(userId: string, ws: AuthenticatedWebSocket): void {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  private sendMessage<T>(ws: AuthenticatedWebSocket, message: WebSocketMessage<T>): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((client) => {
        const ws = client as AuthenticatedWebSocket;
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 5 * 60 * 1000;

      this.wss?.clients.forEach((client) => {
        const ws = client as AuthenticatedWebSocket;
        if (ws.lastActivity && now - ws.lastActivity > timeout) {
          log(`Closing inactive connection for user ${ws.userId}`, "websocket");
          ws.close(4004, "Connection timeout");
        }
      });
    }, 60000);
  }

  broadcastToProject<T>(
    projectId: string,
    message: WebSocketMessage<T>,
    excludeSocket?: AuthenticatedWebSocket
  ): void {
    const connections = this.projectConnections.get(projectId);
    if (!connections) return;

    const payload = JSON.stringify({
      ...message,
      projectId,
      timestamp: message.timestamp || Date.now(),
    });

    connections.forEach((ws) => {
      if (ws !== excludeSocket && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  broadcastToUser<T>(userId: string, message: WebSocketMessage<T>): void {
    const connections = this.userConnections.get(userId);
    if (!connections) return;

    const payload = JSON.stringify({
      ...message,
      timestamp: message.timestamp || Date.now(),
    });

    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  broadcastAll<T>(message: WebSocketMessage<T>): void {
    const payload = JSON.stringify({
      ...message,
      timestamp: message.timestamp || Date.now(),
    });

    this.wss?.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  sendTerminalOutput(projectId: string, data: TerminalOutputData): void {
    this.broadcastToProject(projectId, {
      type: "terminal:output",
      projectId,
      data,
      timestamp: Date.now(),
    });
  }

  sendAgentStatus(projectId: string, data: AgentStatusData): void {
    this.broadcastToProject(projectId, {
      type: "agent:status",
      projectId,
      data,
      timestamp: Date.now(),
    });
  }

  sendFileChanged(projectId: string, data: FileChangedData): void {
    this.broadcastToProject(projectId, {
      type: "file:changed",
      projectId,
      data,
      timestamp: Date.now(),
    });
  }

  sendProjectStatus(projectId: string, data: ProjectStatusData): void {
    this.broadcastToProject(projectId, {
      type: "project:status",
      projectId,
      data,
      timestamp: Date.now(),
    });
  }

  sendChatMessage(projectId: string, data: ChatMessageData): void {
    this.broadcastToProject(projectId, {
      type: "chat:message",
      projectId,
      data,
      timestamp: Date.now(),
    });
  }

  sendProcessOutput(projectId: string, data: ProcessOutputData): void {
    this.broadcastToProject(projectId, {
      type: "process:output",
      projectId,
      data,
      timestamp: Date.now(),
    });
  }

  sendProcessStatus(projectId: string, data: ProcessStatusData): void {
    this.broadcastToProject(projectId, {
      type: "process:status",
      projectId,
      data,
      timestamp: Date.now(),
    });
  }

  private sendTerminalDataToSession(sessionId: string, data: string): void {
    const projectId = sessionId.split("-")[0];
    const connections = this.projectConnections.get(projectId);
    if (!connections) return;

    connections.forEach((ws) => {
      if (ws.terminalSessionIds?.has(sessionId) && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "terminal:output",
          projectId,
          data: { output: data, sessionId },
          timestamp: Date.now(),
        }));
      }
    });
  }

  private initializeCallbacks(): void {
    terminalService.onData((sessionId, data) => {
      this.sendTerminalDataToSession(sessionId, data);
    });

    terminalService.onExit((sessionId, exitCode) => {
      const projectId = sessionId.split("-")[0];
      this.sendTerminalDataToSession(sessionId, `\r\n[Process exited with code ${exitCode}]\r\n`);
    });

    processManager.onOutput((projectId, output) => {
      this.sendProcessOutput(projectId, {
        type: output.type,
        data: output.data,
        timestamp: output.timestamp.getTime(),
      });
    });

    processManager.onStatusChange((projectId, info) => {
      this.sendProcessStatus(projectId, {
        id: info.id,
        projectId: info.projectId,
        command: info.command,
        port: info.port,
        status: info.status,
        startedAt: info.startedAt?.getTime(),
        stoppedAt: info.stoppedAt?.getTime(),
        exitCode: info.exitCode,
        error: info.error,
      });
    });
  }

  getProjectConnectionCount(projectId: string): number {
    return this.projectConnections.get(projectId)?.size || 0;
  }

  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  getTotalConnections(): number {
    return this.wss?.clients.size || 0;
  }

  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.wss?.clients.forEach((client) => {
      client.close(1001, "Server shutting down");
    });
    this.wss?.close();
    log("WebSocket server shut down", "websocket");
  }
}

export const wsService = new WebSocketService();

export function initializeWebSocket(server: Server): void {
  wsService.initialize(server);
}
