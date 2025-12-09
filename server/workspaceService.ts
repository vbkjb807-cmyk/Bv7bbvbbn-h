import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);
const stat = promisify(fs.stat);
const lstat = promisify(fs.lstat);
const access = promisify(fs.access);
const realpath = promisify(fs.realpath);

const WORKSPACE_ROOT = path.join(process.cwd(), "workspaces");

export interface FileInfo {
  name: string;
  path: string;
  relativePath: string;
  type: "file" | "directory";
  size?: number;
  modifiedAt?: Date;
}

export interface FileContent {
  path: string;
  content: string;
  encoding: BufferEncoding;
}

class WorkspaceService {
  private projectTemplates: Record<string, { files: Record<string, string>; packages?: string[] }> = {
    react: {
      files: {
        "package.json": JSON.stringify({
          name: "react-app",
          version: "1.0.0",
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview"
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0"
          },
          devDependencies: {
            "@types/react": "^18.2.0",
            "@types/react-dom": "^18.2.0",
            "@vitejs/plugin-react": "^4.2.0",
            typescript: "^5.3.0",
            vite: "^5.0.0"
          }
        }, null, 2),
        "vite.config.ts": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})`,
        "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
        "src/main.tsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
        "src/App.tsx": `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Welcome to React</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}

export default App`,
        "src/index.css": `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

button {
  background: white;
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

button:hover {
  transform: scale(1.05);
}`,
        "tsconfig.json": JSON.stringify({
          compilerOptions: {
            target: "ES2020",
            useDefineForClassFields: true,
            lib: ["ES2020", "DOM", "DOM.Iterable"],
            module: "ESNext",
            skipLibCheck: true,
            moduleResolution: "bundler",
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx",
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true
          },
          include: ["src"],
          references: [{ path: "./tsconfig.node.json" }]
        }, null, 2),
        "tsconfig.node.json": JSON.stringify({
          compilerOptions: {
            composite: true,
            skipLibCheck: true,
            module: "ESNext",
            moduleResolution: "bundler",
            allowSyntheticDefaultImports: true
          },
          include: ["vite.config.ts"]
        }, null, 2)
      }
    },
    node: {
      files: {
        "package.json": JSON.stringify({
          name: "node-app",
          version: "1.0.0",
          type: "module",
          scripts: {
            dev: "node --watch index.js",
            start: "node index.js"
          }
        }, null, 2),
        "index.js": `import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Hello from Node.js!</h1>');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});`
      }
    },
    express: {
      files: {
        "package.json": JSON.stringify({
          name: "express-app",
          version: "1.0.0",
          type: "module",
          scripts: {
            dev: "node --watch index.js",
            start: "node index.js"
          },
          dependencies: {
            express: "^4.18.2"
          }
        }, null, 2),
        "index.js": `import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h1>Hello from Express!</h1>');
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Express server running on http://localhost:\${PORT}\`);
});`
      }
    },
    python: {
      files: {
        "main.py": `from http.server import HTTPServer, SimpleHTTPRequestHandler
import json

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>Hello from Python!</h1>')
        elif self.path == '/api/hello':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'message': 'Hello, World!'}).encode())
        else:
            super().do_GET()

PORT = 3000
print(f'Python server running on http://localhost:{PORT}')
HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()`,
        "requirements.txt": ""
      }
    },
    html: {
      files: {
        "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello, World!</h1>
    <p>Edit index.html to get started</p>
  </div>
</body>
</html>`,
        "style.css": `/* Add your styles here */`,
        "script.js": `// Add your JavaScript here
console.log('Hello from JavaScript!');`
      }
    }
  };

  async initialize(): Promise<void> {
    try {
      await mkdir(WORKSPACE_ROOT, { recursive: true });
      console.log(`Workspace root initialized at ${WORKSPACE_ROOT}`);
    } catch (error) {
      console.error("Failed to initialize workspace root:", error);
    }
  }

  getWorkspacePath(projectId: string): string {
    const safeId = this.sanitizeProjectId(projectId);
    return path.join(WORKSPACE_ROOT, safeId);
  }

  private sanitizeProjectId(projectId: string): string {
    const sanitized = projectId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitized || sanitized.length !== projectId.length) {
      throw new Error("Invalid project ID");
    }
    return sanitized;
  }

  private sanitizeFilename(filename: string): string {
    const normalized = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, "");
    
    if (normalized.startsWith("/") || normalized.startsWith("\\")) {
      throw new Error("Absolute paths are not allowed");
    }
    
    if (normalized.includes("..")) {
      throw new Error("Path traversal is not allowed");
    }
    
    const parts = normalized.split(path.sep);
    for (const part of parts) {
      if (part === "." || part === "") continue;
      if (!/^[a-zA-Z0-9_.\-\s()[\]]+$/.test(part)) {
        throw new Error(`Invalid characters in path: ${part}`);
      }
    }
    
    return normalized;
  }

  private sanitizePath(projectId: string, filePath: string): string {
    const safeProjectId = this.sanitizeProjectId(projectId);
    const safeFilename = this.sanitizeFilename(filePath);
    
    const workspacePath = path.join(WORKSPACE_ROOT, safeProjectId);
    const resolvedPath = path.resolve(workspacePath, safeFilename);
    
    const workspaceWithSep = workspacePath.endsWith(path.sep) 
      ? workspacePath 
      : workspacePath + path.sep;
    
    if (!resolvedPath.startsWith(workspaceWithSep) && resolvedPath !== workspacePath) {
      throw new Error("Access denied: Path traversal detected");
    }
    
    return resolvedPath;
  }

  private async validateRealPath(targetPath: string, projectId: string): Promise<void> {
    const safeProjectId = this.sanitizeProjectId(projectId);
    const workspacePath = path.join(WORKSPACE_ROOT, safeProjectId);
    
    try {
      const realTargetPath = await realpath(targetPath);
      const realWorkspacePath = await realpath(workspacePath);
      
      const workspaceWithSep = realWorkspacePath.endsWith(path.sep) 
        ? realWorkspacePath 
        : realWorkspacePath + path.sep;
      
      if (!realTargetPath.startsWith(workspaceWithSep) && realTargetPath !== realWorkspacePath) {
        throw new Error("Access denied: Symlink escape detected");
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return;
      }
      if (error.message?.includes("Access denied")) {
        throw error;
      }
    }
  }

  private async checkForSymlink(targetPath: string): Promise<void> {
    try {
      const stats = await lstat(targetPath);
      if (stats.isSymbolicLink()) {
        throw new Error("Access denied: Symbolic links are not allowed");
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return;
      }
      if (error.message?.includes("Access denied")) {
        throw error;
      }
    }
  }

  async createWorkspace(projectId: string, template: string = "react"): Promise<void> {
    const workspacePath = this.getWorkspacePath(projectId);
    
    try {
      await mkdir(workspacePath, { recursive: true });
      
      const templateConfig = this.projectTemplates[template] || this.projectTemplates.react;
      
      for (const [filePath, content] of Object.entries(templateConfig.files)) {
        const fullPath = path.join(workspacePath, filePath);
        const dirPath = path.dirname(fullPath);
        await mkdir(dirPath, { recursive: true });
        await writeFile(fullPath, content, "utf8");
      }
      
      console.log(`Workspace created for project ${projectId} with template ${template}`);
    } catch (error) {
      console.error(`Failed to create workspace for project ${projectId}:`, error);
      throw error;
    }
  }

  async deleteWorkspace(projectId: string): Promise<void> {
    const workspacePath = this.getWorkspacePath(projectId);
    
    try {
      await this.deleteDirectory(workspacePath);
      console.log(`Workspace deleted for project ${projectId}`);
    } catch (error) {
      console.error(`Failed to delete workspace for project ${projectId}:`, error);
      throw error;
    }
  }

  private async deleteDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await this.deleteDirectory(fullPath);
        } else {
          await unlink(fullPath);
        }
      }
      
      await rmdir(dirPath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  async workspaceExists(projectId: string): Promise<boolean> {
    const workspacePath = this.getWorkspacePath(projectId);
    try {
      await access(workspacePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(projectId: string, relativePath: string = ""): Promise<FileInfo[]> {
    const targetPath = this.sanitizePath(projectId, relativePath);
    const workspacePath = this.getWorkspacePath(projectId);
    const files: FileInfo[] = [];
    
    try {
      const entries = await readdir(targetPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") {
          continue;
        }
        
        if (entry.isSymbolicLink()) {
          continue;
        }
        
        const fullPath = path.join(targetPath, entry.name);
        const relPath = path.relative(workspacePath, fullPath);
        
        const fileInfo: FileInfo = {
          name: entry.name,
          path: fullPath,
          relativePath: relPath,
          type: entry.isDirectory() ? "directory" : "file"
        };
        
        if (entry.isFile()) {
          try {
            const fileStat = await stat(fullPath);
            fileInfo.size = fileStat.size;
            fileInfo.modifiedAt = fileStat.mtime;
          } catch {}
        }
        
        files.push(fileInfo);
      }
      
      return files.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async listAllFiles(projectId: string, relativePath: string = ""): Promise<FileInfo[]> {
    const allFiles: FileInfo[] = [];
    const files = await this.listFiles(projectId, relativePath);
    
    for (const file of files) {
      allFiles.push(file);
      if (file.type === "directory") {
        const subFiles = await this.listAllFiles(projectId, file.relativePath);
        allFiles.push(...subFiles);
      }
    }
    
    return allFiles;
  }

  async readFile(projectId: string, filePath: string): Promise<FileContent> {
    const fullPath = this.sanitizePath(projectId, filePath);
    
    await this.checkForSymlink(fullPath);
    await this.validateRealPath(fullPath, projectId);
    
    try {
      const content = await readFile(fullPath, "utf8");
      return {
        path: filePath,
        content,
        encoding: "utf8"
      };
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  async writeFile(projectId: string, filePath: string, content: string): Promise<void> {
    const fullPath = this.sanitizePath(projectId, filePath);
    const dirPath = path.dirname(fullPath);
    
    await this.checkForSymlink(fullPath);
    await this.checkForSymlink(dirPath);
    
    try {
      await mkdir(dirPath, { recursive: true });
      
      await this.validateRealPath(dirPath, projectId);
      
      await writeFile(fullPath, content, "utf8");
    } catch (error: any) {
      if (error.message?.includes("Access denied")) {
        throw error;
      }
      console.error(`Failed to write file ${filePath}:`, error);
      throw error;
    }
  }

  async deleteFile(projectId: string, filePath: string): Promise<void> {
    const fullPath = this.sanitizePath(projectId, filePath);
    
    await this.checkForSymlink(fullPath);
    await this.validateRealPath(fullPath, projectId);
    
    try {
      const fileStat = await stat(fullPath);
      if (fileStat.isDirectory()) {
        await this.deleteDirectory(fullPath);
      } else {
        await unlink(fullPath);
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  async renameFile(projectId: string, oldPath: string, newPath: string): Promise<void> {
    const oldFullPath = this.sanitizePath(projectId, oldPath);
    const newFullPath = this.sanitizePath(projectId, newPath);
    
    await this.checkForSymlink(oldFullPath);
    await this.checkForSymlink(newFullPath);
    await this.validateRealPath(oldFullPath, projectId);
    
    const rename = promisify(fs.rename);
    const newDirPath = path.dirname(newFullPath);
    
    try {
      await mkdir(newDirPath, { recursive: true });
      await this.validateRealPath(newDirPath, projectId);
      await rename(oldFullPath, newFullPath);
    } catch (error: any) {
      if (error.message?.includes("Access denied")) {
        throw error;
      }
      console.error(`Failed to rename ${oldPath} to ${newPath}:`, error);
      throw error;
    }
  }

  async createDirectory(projectId: string, dirPath: string): Promise<void> {
    const fullPath = this.sanitizePath(projectId, dirPath);
    
    await this.checkForSymlink(fullPath);
    
    try {
      await mkdir(fullPath, { recursive: true });
      await this.validateRealPath(fullPath, projectId);
    } catch (error: any) {
      if (error.message?.includes("Access denied")) {
        throw error;
      }
      console.error(`Failed to create directory ${dirPath}:`, error);
      throw error;
    }
  }

  async fileExists(projectId: string, filePath: string): Promise<boolean> {
    const fullPath = this.sanitizePath(projectId, filePath);
    try {
      await access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStats(projectId: string, filePath: string): Promise<{ size: number; modifiedAt: Date }> {
    const fullPath = this.sanitizePath(projectId, filePath);
    const fileStat = await stat(fullPath);
    return {
      size: fileStat.size,
      modifiedAt: fileStat.mtime
    };
  }

  getAvailableTemplates(): string[] {
    return Object.keys(this.projectTemplates);
  }
}

export const workspaceService = new WorkspaceService();
