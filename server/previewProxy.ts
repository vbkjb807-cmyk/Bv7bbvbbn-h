import type { Express, Request, Response } from "express";
import httpProxy from "http-proxy";
import { processManager } from "./processManager";
import { log } from "./index";

const proxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
  xfwd: true
});

proxy.on("error", (err, req, res) => {
  log(`Proxy error: ${err.message}`, "preview");
  if (res && "writeHead" in res) {
    const response = res as Response;
    if (!response.headersSent) {
      response.writeHead(502, { "Content-Type": "text/html" });
      response.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview Not Ready</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              text-align: center;
            }
            .container { padding: 2rem; }
            h1 { margin-bottom: 1rem; }
            p { opacity: 0.7; margin-bottom: 2rem; }
            .spinner {
              width: 40px;
              height: 40px;
              border: 3px solid rgba(255,255,255,0.3);
              border-top-color: white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
          <script>setTimeout(() => location.reload(), 2000);</script>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h1>Starting Preview...</h1>
            <p>The development server is starting up. This page will refresh automatically.</p>
          </div>
        </body>
        </html>
      `);
    }
  }
});

export function setupPreviewProxy(app: Express): void {
  app.use("/preview/:projectId", (req: Request, res: Response) => {
    const { projectId } = req.params;
    const port = processManager.getPort(projectId);

    if (!port) {
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>No Preview Available</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              text-align: center;
            }
            .container { padding: 2rem; max-width: 500px; }
            h1 { margin-bottom: 1rem; }
            p { opacity: 0.7; margin-bottom: 2rem; }
            .icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🚀</div>
            <h1>Start the Development Server</h1>
            <p>Run "npm run dev" or click the Run button in the IDE to start your application.</p>
          </div>
        </body>
        </html>
      `);
      return;
    }

    const originalUrl = req.originalUrl;
    const basePath = `/preview/${projectId}`;
    const targetPath = originalUrl.substring(basePath.length) || "/";

    req.url = targetPath;

    proxy.web(req, res, {
      target: `http://localhost:${port}`,
      headers: {
        "X-Forwarded-Host": req.headers.host || "",
        "X-Forwarded-Proto": "https"
      }
    });
  });

  log("Preview proxy initialized", "preview");
}

export function getPreviewUrl(projectId: string): string {
  return `/preview/${projectId}`;
}

export function isPreviewAvailable(projectId: string): boolean {
  return processManager.isRunning(projectId);
}
