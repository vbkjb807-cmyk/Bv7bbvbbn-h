import { spawn, ChildProcess, exec } from "child_process";
import { promisify } from "util";
import { workspaceService } from "./workspaceService";
import { log } from "./index";

const execAsync = promisify(exec);

export interface ProcessInfo {
  id: string;
  projectId: string;
  command: string;
  args: string[];
  port?: number;
  pid?: number;
  status: "starting" | "running" | "stopped" | "error";
  startedAt?: Date;
  stoppedAt?: Date;
  exitCode?: number;
  error?: string;
}

export interface ProcessOutput {
  type: "stdout" | "stderr" | "system";
  data: string;
  timestamp: Date;
}

type ProcessOutputCallback = (projectId: string, output: ProcessOutput) => void;
type ProcessStatusCallback = (projectId: string, status: ProcessInfo) => void;

class ProcessManager {
  private processes: Map<string, { process: ChildProcess; info: ProcessInfo }> = new Map();
  private portAllocations: Map<string, number> = new Map();
  private outputCallbacks: ProcessOutputCallback[] = [];
  private statusCallbacks: ProcessStatusCallback[] = [];
  private basePort = 3001;
  private maxPort = 3100;

  onOutput(callback: ProcessOutputCallback): void {
    this.outputCallbacks.push(callback);
  }

  onStatusChange(callback: ProcessStatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  private emitOutput(projectId: string, output: ProcessOutput): void {
    for (const callback of this.outputCallbacks) {
      try {
        callback(projectId, output);
      } catch (error) {
        console.error("Error in output callback:", error);
      }
    }
  }

  private emitStatusChange(projectId: string, info: ProcessInfo): void {
    for (const callback of this.statusCallbacks) {
      try {
        callback(projectId, info);
      } catch (error) {
        console.error("Error in status callback:", error);
      }
    }
  }

  private allocatePort(projectId: string): number {
    const existingPort = this.portAllocations.get(projectId);
    if (existingPort) {
      return existingPort;
    }

    const usedPorts = new Set(this.portAllocations.values());
    for (let port = this.basePort; port <= this.maxPort; port++) {
      if (!usedPorts.has(port)) {
        this.portAllocations.set(projectId, port);
        return port;
      }
    }

    throw new Error("No available ports");
  }

  private releasePort(projectId: string): void {
    this.portAllocations.delete(projectId);
  }

  getPort(projectId: string): number | undefined {
    return this.portAllocations.get(projectId);
  }

  async startProcess(
    projectId: string,
    command: string,
    args: string[] = [],
    env: Record<string, string> = {}
  ): Promise<ProcessInfo> {
    const existingProcess = this.processes.get(projectId);
    if (existingProcess && existingProcess.info.status === "running") {
      await this.stopProcess(projectId);
    }

    const workspacePath = workspaceService.getWorkspacePath(projectId);
    const port = this.allocatePort(projectId);

    const info: ProcessInfo = {
      id: `${projectId}-${Date.now()}`,
      projectId,
      command,
      args,
      port,
      status: "starting",
      startedAt: new Date()
    };

    this.emitOutput(projectId, {
      type: "system",
      data: `Starting ${command} ${args.join(" ")}...\n`,
      timestamp: new Date()
    });

    try {
      const processEnv = {
        ...process.env,
        PORT: String(port),
        NODE_ENV: "development",
        ...env
      };

      const childProcess = spawn(command, args, {
        cwd: workspacePath,
        env: processEnv,
        shell: true,
        stdio: ["pipe", "pipe", "pipe"]
      });

      info.pid = childProcess.pid;
      info.status = "running";

      this.processes.set(projectId, { process: childProcess, info });
      this.emitStatusChange(projectId, info);

      childProcess.stdout?.on("data", (data: Buffer) => {
        const output = data.toString();
        this.emitOutput(projectId, {
          type: "stdout",
          data: output,
          timestamp: new Date()
        });
      });

      childProcess.stderr?.on("data", (data: Buffer) => {
        const output = data.toString();
        this.emitOutput(projectId, {
          type: "stderr",
          data: output,
          timestamp: new Date()
        });
      });

      childProcess.on("exit", (code, signal) => {
        const processEntry = this.processes.get(projectId);
        if (processEntry) {
          processEntry.info.status = code === 0 ? "stopped" : "error";
          processEntry.info.stoppedAt = new Date();
          processEntry.info.exitCode = code ?? undefined;
          
          this.emitOutput(projectId, {
            type: "system",
            data: `\nProcess exited with code ${code}${signal ? ` (signal: ${signal})` : ""}\n`,
            timestamp: new Date()
          });
          
          this.emitStatusChange(projectId, processEntry.info);
        }
        this.releasePort(projectId);
      });

      childProcess.on("error", (error) => {
        const processEntry = this.processes.get(projectId);
        if (processEntry) {
          processEntry.info.status = "error";
          processEntry.info.error = error.message;
          
          this.emitOutput(projectId, {
            type: "system",
            data: `\nProcess error: ${error.message}\n`,
            timestamp: new Date()
          });
          
          this.emitStatusChange(projectId, processEntry.info);
        }
        this.releasePort(projectId);
      });

      log(`Process started for project ${projectId}: ${command} on port ${port}`, "process");
      
      return info;
    } catch (error: any) {
      info.status = "error";
      info.error = error.message;
      this.releasePort(projectId);
      this.emitStatusChange(projectId, info);
      throw error;
    }
  }

  async stopProcess(projectId: string): Promise<void> {
    const processEntry = this.processes.get(projectId);
    if (!processEntry) {
      return;
    }

    const { process: childProcess, info } = processEntry;

    if (info.status === "stopped" || info.status === "error") {
      this.processes.delete(projectId);
      this.releasePort(projectId);
      return;
    }

    this.emitOutput(projectId, {
      type: "system",
      data: "\nStopping process...\n",
      timestamp: new Date()
    });

    return new Promise((resolve) => {
      const cleanup = () => {
        info.status = "stopped";
        info.stoppedAt = new Date();
        this.processes.delete(projectId);
        this.releasePort(projectId);
        this.emitStatusChange(projectId, info);
        resolve();
      };

      if (!childProcess.pid || childProcess.exitCode !== null) {
        cleanup();
        return;
      }

      const timeout = setTimeout(() => {
        try {
          childProcess.kill("SIGKILL");
        } catch {}
        cleanup();
      }, 5000);

      childProcess.once("exit", () => {
        clearTimeout(timeout);
        cleanup();
      });

      try {
        childProcess.kill("SIGTERM");
      } catch {
        clearTimeout(timeout);
        cleanup();
      }
    });
  }

  async restartProcess(projectId: string): Promise<ProcessInfo> {
    const processEntry = this.processes.get(projectId);
    if (!processEntry) {
      throw new Error("No process to restart");
    }

    const { command, args } = processEntry.info;
    await this.stopProcess(projectId);
    return this.startProcess(projectId, command, args);
  }

  getProcessInfo(projectId: string): ProcessInfo | undefined {
    return this.processes.get(projectId)?.info;
  }

  isRunning(projectId: string): boolean {
    const processEntry = this.processes.get(projectId);
    return processEntry?.info.status === "running";
  }

  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values()).map(p => p.info);
  }

  async killAllProcesses(): Promise<void> {
    const stopPromises = Array.from(this.processes.keys()).map(projectId =>
      this.stopProcess(projectId)
    );
    await Promise.all(stopPromises);
  }

  async runCommand(
    projectId: string,
    command: string,
    timeout: number = 60000
  ): Promise<{ stdout: string; stderr: string }> {
    const workspacePath = workspaceService.getWorkspacePath(projectId);
    
    this.emitOutput(projectId, {
      type: "system",
      data: `$ ${command}\n`,
      timestamp: new Date()
    });

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workspacePath,
        timeout,
        env: {
          ...process.env,
          NODE_ENV: "development"
        }
      });

      if (stdout) {
        this.emitOutput(projectId, {
          type: "stdout",
          data: stdout,
          timestamp: new Date()
        });
      }

      if (stderr) {
        this.emitOutput(projectId, {
          type: "stderr",
          data: stderr,
          timestamp: new Date()
        });
      }

      return { stdout, stderr };
    } catch (error: any) {
      this.emitOutput(projectId, {
        type: "stderr",
        data: error.message || "Command failed",
        timestamp: new Date()
      });
      throw error;
    }
  }

  async installDependencies(projectId: string): Promise<void> {
    const hasPackageJson = await workspaceService.fileExists(projectId, "package.json");
    
    if (hasPackageJson) {
      this.emitOutput(projectId, {
        type: "system",
        data: "Installing npm dependencies...\n",
        timestamp: new Date()
      });
      await this.runCommand(projectId, "npm install", 120000);
      this.emitOutput(projectId, {
        type: "system",
        data: "Dependencies installed successfully!\n",
        timestamp: new Date()
      });
    }
    
    const hasRequirements = await workspaceService.fileExists(projectId, "requirements.txt");
    if (hasRequirements) {
      this.emitOutput(projectId, {
        type: "system",
        data: "Installing Python dependencies...\n",
        timestamp: new Date()
      });
      await this.runCommand(projectId, "pip install -r requirements.txt", 120000);
    }
  }

  async startDevServer(projectId: string): Promise<ProcessInfo> {
    const hasPackageJson = await workspaceService.fileExists(projectId, "package.json");
    
    if (hasPackageJson) {
      try {
        const packageJson = await workspaceService.readFile(projectId, "package.json");
        const pkg = JSON.parse(packageJson.content);
        
        if (pkg.scripts?.dev) {
          return this.startProcess(projectId, "npm", ["run", "dev"]);
        } else if (pkg.scripts?.start) {
          return this.startProcess(projectId, "npm", ["start"]);
        }
      } catch (error) {
        log(`Error parsing package.json: ${error}`, "process");
      }
    }
    
    const hasPythonMain = await workspaceService.fileExists(projectId, "main.py");
    if (hasPythonMain) {
      return this.startProcess(projectId, "python3", ["main.py"]);
    }
    
    const hasIndexHtml = await workspaceService.fileExists(projectId, "index.html");
    if (hasIndexHtml) {
      return this.startProcess(projectId, "npx", ["serve", "-l", "3000"]);
    }
    
    throw new Error("No runnable configuration found");
  }
}

export const processManager = new ProcessManager();
