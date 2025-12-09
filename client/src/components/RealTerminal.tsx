import { useEffect, useRef, useCallback, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { Button } from "@/components/ui/button";
import { Loader2, X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealTerminalProps {
  projectId: string;
  tabId: string;
  isConnected: boolean;
  createTerminal: (tabId: string, cols?: number, rows?: number) => void;
  sendTerminalInput: (sessionId: string, data: string) => void;
  resizeTerminal: (sessionId: string, cols: number, rows: number) => void;
  terminalSessionId: string | null;
  initialBuffer?: string[];
  onBufferFlushed?: () => void;
  onOutput?: (data: string) => void;
}

export function RealTerminal({
  projectId,
  tabId,
  isConnected,
  createTerminal,
  sendTerminalInput,
  resizeTerminal,
  terminalSessionId,
  initialBuffer,
  onBufferFlushed,
  onOutput,
}: RealTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const terminalSessionIdRef = useRef<string | null>(terminalSessionId);
  terminalSessionIdRef.current = terminalSessionId;

  const sendTerminalInputRef = useRef(sendTerminalInput);
  sendTerminalInputRef.current = sendTerminalInput;

  const initializeTerminal = useCallback(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const terminal = new Terminal({
      theme: {
        background: "#0d1117",
        foreground: "#c9d1d9",
        cursor: "#c9d1d9",
        cursorAccent: "#0d1117",
        selectionBackground: "#3b5998",
        black: "#0d1117",
        red: "#f85149",
        green: "#56d364",
        yellow: "#e3b341",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#c9d1d9",
        brightBlack: "#484f58",
        brightRed: "#f85149",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#58a6ff",
        brightMagenta: "#bc8cff",
        brightCyan: "#39c5cf",
        brightWhite: "#ffffff",
      },
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 10000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);

    try {
      fitAddon.fit();
    } catch (e) {
      console.warn("Could not fit terminal:", e);
    }

    terminal.onData((data) => {
      if (terminalSessionIdRef.current) {
        sendTerminalInputRef.current(terminalSessionIdRef.current, data);
      }
    });

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    return terminal;
  }, []);

  const resizeTerminalRef = useRef(resizeTerminal);
  resizeTerminalRef.current = resizeTerminal;

  useEffect(() => {
    const terminal = initializeTerminal();

    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
          const { cols, rows } = xtermRef.current;
          if (terminalSessionIdRef.current) {
            resizeTerminalRef.current(terminalSessionIdRef.current, cols, rows);
          }
        } catch (e) {
          console.warn("Resize error:", e);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, [initializeTerminal]);

  useEffect(() => {
    if (isConnected && !terminalSessionId && !isInitializing) {
      setIsInitializing(true);
      const cols = xtermRef.current?.cols || 80;
      const rows = xtermRef.current?.rows || 24;
      createTerminal(tabId, cols, rows);
    }
  }, [isConnected, terminalSessionId, createTerminal, isInitializing, tabId]);

  const hasInitializedSession = useRef(false);
  const bufferFlushedRef = useRef(false);
  const lastSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (terminalSessionId !== lastSessionIdRef.current) {
      if (terminalSessionId === null) {
        hasInitializedSession.current = false;
        bufferFlushedRef.current = false;
        if (xtermRef.current) {
          xtermRef.current.write("\r\n\x1b[33m$ Connection lost...\x1b[0m\r\n");
        }
      } else if (!hasInitializedSession.current) {
        hasInitializedSession.current = true;
        setIsInitializing(false);
        if (xtermRef.current) {
          if (lastSessionIdRef.current !== null) {
            xtermRef.current.write("\x1b[32m$ Reconnected to terminal\x1b[0m\r\n");
          } else {
            xtermRef.current.write("\x1b[32m$ Connected to terminal session\x1b[0m\r\n");
          }
        }
      }
      lastSessionIdRef.current = terminalSessionId;
    }
  }, [terminalSessionId]);

  const onBufferFlushedRef = useRef(onBufferFlushed);
  onBufferFlushedRef.current = onBufferFlushed;

  useEffect(() => {
    if (terminalSessionId && initialBuffer && initialBuffer.length > 0 && !bufferFlushedRef.current) {
      bufferFlushedRef.current = true;
      initialBuffer.forEach((data) => {
        xtermRef.current?.write(data);
      });
      onBufferFlushedRef.current?.();
    }
  }, [terminalSessionId, initialBuffer]);

  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  useEffect(() => {
    (window as any).__writeTerminal = (data: string) => {
      if (xtermRef.current) {
        xtermRef.current.write(data);
        onOutputRef.current?.(data);
      }
    };
    return () => {
      delete (window as any).__writeTerminal;
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/80 z-10">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Connecting to terminal...</span>
          </div>
        </div>
      )}
      {isConnected && !terminalSessionId && isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/80 z-10">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Starting terminal session...</span>
          </div>
        </div>
      )}
      <div
        ref={terminalRef}
        className="flex-1 min-h-0"
        data-testid="real-terminal"
      />
    </div>
  );
}

export function useTerminalOutput(sessionId: string | null, writeToTerminal: (data: string) => void) {
  return useCallback((data: { output?: string; sessionId?: string }) => {
    if (data.output && (!data.sessionId || data.sessionId === sessionId)) {
      writeToTerminal(data.output);
    }
  }, [sessionId, writeToTerminal]);
}