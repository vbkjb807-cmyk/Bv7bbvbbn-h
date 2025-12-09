import * as pty from "node-pty";
import { workspaceService } from "./workspaceService";
import { log } from "./index";

export interface TerminalSession {
  id: string;
  projectId: string;
  pty: pty.IPty;
  cols: number;
  rows: number;
  createdAt: Date;
  lastActivity: Date;
}

type TerminalDataCallback = (sessionId: string, data: string) => void;
type TerminalExitCallback = (sessionId: string, exitCode: number) => void;

class TerminalService {
  private sessions: Map<string, TerminalSession> = new Map();
  private dataCallbacks: TerminalDataCallback[] = [];
  private exitCallbacks: TerminalExitCallback[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private sessionTimeout = 30 * 60 * 1000;

  constructor() {
    this.startCleanup();
  }

  onData(callback: TerminalDataCallback): void {
    this.dataCallbacks.push(callback);
  }

  onExit(callback: TerminalExitCallback): void {
    this.exitCallbacks.push(callback);
  }

  private emitData(sessionId: string, data: string): void {
    for (const callback of this.dataCallbacks) {
      try {
        callback(sessionId, data);
      } catch (error) {
        console.error("Error in terminal data callback:", error);
      }
    }
  }

  private emitExit(sessionId: string, exitCode: number): void {
    for (const callback of this.exitCallbacks) {
      try {
        callback(sessionId, exitCode);
      } catch (error) {
        console.error("Error in terminal exit callback:", error);
      }
    }
  }

  createSession(projectId: string, cols: number = 80, rows: number = 24): string {
    const sessionId = `${projectId}-${Date.now()}`;
    const workspacePath = workspaceService.getWorkspacePath(projectId);

    const shell = process.platform === "win32" ? "powershell.exe" : "bash";

    try {
      const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-256color",
        cols,
        rows,
        cwd: workspacePath,
        env: {
          ...process.env,
          TERM: "xterm-256color",
          COLORTERM: "truecolor",
          LANG: "en_US.UTF-8"
        }
      });

      const session: TerminalSession = {
        id: sessionId,
        projectId,
        pty: ptyProcess,
        cols,
        rows,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      this.sessions.set(sessionId, session);

      ptyProcess.onData((data: string) => {
        session.lastActivity = new Date();
        this.emitData(sessionId, data);
      });

      ptyProcess.onExit(({ exitCode }) => {
        log(`Terminal session ${sessionId} exited with code ${exitCode}`, "terminal");
        this.emitExit(sessionId, exitCode);
        this.sessions.delete(sessionId);
      });

      log(`Terminal session created: ${sessionId}`, "terminal");
      return sessionId;
    } catch (error) {
      log(`Failed to create terminal session: ${error}`, "terminal");
      throw error;
    }
  }

  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Terminal session ${sessionId} not found`);
    }

    session.lastActivity = new Date();
    session.pty.write(data);
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Terminal session ${sessionId} not found`);
    }

    session.cols = cols;
    session.rows = rows;
    session.pty.resize(cols, rows);
  }

  destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pty.kill();
      this.sessions.delete(sessionId);
      log(`Terminal session destroyed: ${sessionId}`, "terminal");
    }
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionsByProject(projectId: string): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.projectId === projectId
    );
  }

  destroyProjectSessions(projectId: string): void {
    const sessions = this.getSessionsByProject(projectId);
    for (const session of sessions) {
      this.destroySession(session.id);
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions) {
        if (now - session.lastActivity.getTime() > this.sessionTimeout) {
          log(`Cleaning up inactive terminal session: ${sessionId}`, "terminal");
          this.destroySession(sessionId);
        }
      }
    }, 60000);
  }

  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    for (const sessionId of this.sessions.keys()) {
      this.destroySession(sessionId);
    }
    log("Terminal service shut down", "terminal");
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}

export const terminalService = new TerminalService();
