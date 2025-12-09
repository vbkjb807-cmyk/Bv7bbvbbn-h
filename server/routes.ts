import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isProgrammer, isAdmin } from "./firebaseAuth";
import {
  insertProjectSchema,
  insertMessageSchema,
  insertFileSchema,
  insertTaskSchema,
} from "@shared/schema";
import { wsService } from "./websocket";
import { workspaceService } from "./workspaceService";
import { processManager } from "./processManager";
import { setupPreviewProxy, getPreviewUrl, isPreviewAvailable } from "./previewProxy";
import { agentOrchestrator } from "./agentOrchestrator";
import { aiProvider, RECOMMENDED_MODELS } from "./aiProvider";

export async function registerRoutes(server: Server, app: Express): Promise<void> {
  // Initialize workspace service
  await workspaceService.initialize();
  
  // Setup preview proxy
  setupPreviewProxy(app);
  
  // Auth middleware
  await setupAuth(app);

  // Stats
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const stats = await storage.getProjectStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Projects
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const projects = await storage.getProjectsByUserId(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const userId = req.currentUser?.id;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const data = insertProjectSchema.parse({
        ...req.body,
        userId,
        status: "pending",
      });
      
      const project = await storage.createProject(data);
      res.status(201).json(project);
    } catch (error: any) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: error.message || "Failed to create project" });
    }
  });

  app.post("/api/projects/:id/start-ai", isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userId = req.currentUser?.id;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const projectId = req.params.id;

      // Update project status
      await storage.updateProject(projectId, { status: "ai_processing" });
      wsService.sendProjectStatus(projectId, {
        projectId,
        status: "ai_processing",
        previousStatus: "pending",
        message: "AI processing started",
      });

      // Create agent logs for each AI agent
      const agentTypes = ["ui_ux", "backend", "database", "qa", "devops"];
      for (const agentType of agentTypes) {
        await storage.createAgentLog({
          projectId,
          agentType,
          action: "started",
          status: "running",
        });
        wsService.sendAgentStatus(projectId, {
          agentType,
          status: "running",
          progress: 0,
          message: `${agentType} agent started`,
        });
      }

      // Simulate AI processing (in real app, this would trigger actual AI)
      setTimeout(async () => {
        try {
          // Simulate AI completion with progress updates
          for (let i = 0; i < agentTypes.length; i++) {
            const agentType = agentTypes[i];
            const logs = await storage.getAgentLogsByProjectId(projectId);
            const log = logs.find(l => l.agentType === agentType);
            if (log) {
              await storage.updateAgentLog(log.id, { status: "completed", result: "Success" });
              wsService.sendAgentStatus(projectId, {
                agentType,
                status: "completed",
                progress: 100,
                message: `${agentType} agent completed successfully`,
                result: "Success",
              });
              wsService.sendTerminalOutput(projectId, {
                output: `[${agentType.toUpperCase()}] Agent completed successfully`,
                agentType,
              });
            }
          }

          // Create sample files with WebSocket notifications
          const sampleFiles = [
            { filename: "App.tsx", agentType: "ui_ux", linesCount: 150, size: 4500, content: "// React App Component\nimport React from 'react';\n\nexport default function App() {\n  return <div>Hello World</div>;\n}" },
            { filename: "api/routes.ts", agentType: "backend", linesCount: 200, size: 6000, content: "// API Routes\nimport express from 'express';\n\nconst router = express.Router();\n\nrouter.get('/', (req, res) => res.json({ message: 'API' }));\n" },
            { filename: "schema.ts", agentType: "database", linesCount: 100, size: 3000, content: "// Database Schema\nexport const users = {\n  id: 'serial',\n  name: 'varchar',\n  email: 'varchar'\n};" },
            { filename: "tests/app.test.ts", agentType: "qa", linesCount: 80, size: 2400, content: "// Test Suite\ndescribe('App', () => {\n  it('should render', () => {\n    expect(true).toBe(true);\n  });\n});" },
            { filename: "docker-compose.yml", agentType: "devops", linesCount: 50, size: 1500, content: "version: '3'\nservices:\n  app:\n    build: .\n    ports:\n      - '3000:3000'" },
          ];

          for (const file of sampleFiles) {
            const createdFile = await storage.createFile({
              projectId,
              filename: file.filename,
              agentType: file.agentType,
              linesCount: file.linesCount,
              size: file.size,
              content: file.content,
              status: "completed",
            });
            wsService.sendFileChanged(projectId, {
              fileId: createdFile.id,
              filename: createdFile.filename,
              action: "created",
              agentType: file.agentType,
            });
            wsService.sendTerminalOutput(projectId, {
              output: `[${file.agentType.toUpperCase()}] Created file: ${file.filename}`,
              agentType: file.agentType,
            });
          }

          // Update project status and calculate cost
          const cost = "15.50";
          const currentProject = await storage.getProject(projectId);
          const newSpent = (parseFloat(currentProject?.spent || "0") + parseFloat(cost)).toFixed(2);
          
          await storage.updateProject(projectId, { 
            status: "ai_completed",
            spent: newSpent,
          });
          wsService.sendProjectStatus(projectId, {
            projectId,
            status: "ai_completed",
            previousStatus: "ai_processing",
            message: "AI processing completed successfully",
          });

          // Create transaction for the charge
          const user = await storage.getUser(userId);
          const newBalance = (parseFloat(user?.balance || "0") - parseFloat(cost)).toFixed(2);
          await storage.updateUserBalance(userId, `-${cost}`);
          await storage.createTransaction({
            userId,
            type: "charge",
            amount: cost,
            description: `AI processing for project: ${project.title}`,
            balanceAfter: newBalance,
            projectId,
          });
        } catch (error) {
          console.error("Error in AI processing:", error);
          wsService.sendProjectStatus(projectId, {
            projectId,
            status: "failed",
            previousStatus: "ai_processing",
            message: "AI processing failed",
          });
        }
      }, 5000);

      res.json({ message: "AI processing started" });
    } catch (error) {
      console.error("Error starting AI:", error);
      res.status(500).json({ message: "Failed to start AI processing" });
    }
  });

  app.post("/api/projects/:id/request-programmer", isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userId = req.currentUser?.id;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { reason } = req.body;

      // Find an available programmer
      const programmers = await storage.getAvailableProgrammers();
      if (programmers.length === 0) {
        // Create a task for when programmers become available
        await storage.createTask({
          projectId: req.params.id,
          title: `Human assistance requested for: ${project.title}`,
          description: reason || "AI could not complete the task",
          status: "pending",
          priority: "high",
          requestedByUser: true,
          aiFailedReason: reason || "User requested human assistance",
        });

        await storage.updateProject(req.params.id, {
          status: "human_requested",
        });

        return res.json({ message: "Request submitted. Will be assigned when a programmer is available." });
      }

      const programmer = programmers[0];
      
      // Create task for the programmer
      await storage.createTask({
        projectId: req.params.id,
        programmerId: programmer.id,
        title: `Work on: ${project.title}`,
        description: reason || "User requested human assistance",
        status: "pending",
        priority: "high",
        requestedByUser: true,
      });

      await storage.updateProject(req.params.id, {
        status: "human_assigned",
        programmerId: programmer.id,
      });

      res.json({ message: "Programmer assigned", programmerId: programmer.id });
    } catch (error) {
      console.error("Error requesting programmer:", error);
      res.status(500).json({ message: "Failed to request programmer" });
    }
  });

  // Files
  app.get("/api/projects/:id/files", isAuthenticated, async (req: any, res) => {
    try {
      const files = await storage.getFilesByProjectId(req.params.id);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/projects/:id/files", isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userId = req.currentUser?.id;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const data = insertFileSchema.parse({
        ...req.body,
        projectId: req.params.id,
      });

      const file = await storage.createFile(data);
      res.status(201).json(file);
    } catch (error: any) {
      console.error("Error creating file:", error);
      res.status(400).json({ message: error.message || "Failed to create file" });
    }
  });

  app.patch("/api/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const project = await storage.getProject(file.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userId = req.currentUser?.id;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { content, filename } = req.body;
      const updatedFile = await storage.updateFile(req.params.id, { 
        content, 
        filename,
        linesCount: content ? content.split('\n').length : file.linesCount,
        size: content ? new Blob([content]).size : file.size,
      });

      wsService.sendFileChanged(file.projectId, {
        fileId: updatedFile!.id,
        filename: updatedFile!.filename,
        action: "updated",
        agentType: updatedFile!.agentType || undefined,
      });

      res.json(updatedFile);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  app.delete("/api/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const project = await storage.getProject(file.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const userId = req.currentUser?.id;
      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const projectId = file.projectId;
      const filename = file.filename;
      await storage.deleteFile(req.params.id);

      wsService.sendFileChanged(projectId, {
        fileId: req.params.id,
        filename,
        action: "deleted",
      });

      res.json({ message: "File deleted" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Agent Logs
  app.get("/api/projects/:id/agents", isAuthenticated, async (req: any, res) => {
    try {
      const logs = await storage.getAgentLogsByProjectId(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching agent logs:", error);
      res.status(500).json({ message: "Failed to fetch agent logs" });
    }
  });

  // AI Chat Messages
  app.get("/api/projects/:id/ai-chat", isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getAiChatMessagesByProjectId(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching AI chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/projects/:id/ai-chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const project = await storage.getProject(req.params.id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { content, collaborative = false } = req.body;
      
      // Save user message
      const userMessage = await storage.createAiChatMessage({
        projectId: req.params.id,
        userId,
        role: "user",
        content,
      });

      // Initialize or get project context for AI
      let context = agentOrchestrator.getContext(req.params.id);
      if (!context) {
        context = agentOrchestrator.initializeContext(req.params.id, {
          title: project.title,
          description: project.description || '',
          projectType: project.projectType || 'web'
        });
      }

      let aiResponseContent: string;
      let agentType: string = 'orchestrator';

      try {
        if (collaborative) {
          // Full collaborative processing with all agents
          const result = await agentOrchestrator.processProjectCollaboratively(req.params.id, content);
          aiResponseContent = result.orchestratorResponse;
          
          // Save individual agent contributions
          for (const contrib of result.agentContributions) {
            await storage.createAiChatMessage({
              projectId: req.params.id,
              userId,
              role: "assistant",
              content: contrib.contribution,
              agentType: contrib.agent,
              metadata: { type: 'agent_contribution' }
            });
          }
        } else {
          // Quick single-agent response
          const result = await agentOrchestrator.quickResponse(req.params.id, content);
          aiResponseContent = result.response;
          agentType = result.suggestedAgent || 'orchestrator';
        }
      } catch (aiError: any) {
        console.error("AI processing error:", aiError);
        // Fallback to simple response
        aiResponseContent = generateAIResponse(content, project);
      }

      const aiResponse = await storage.createAiChatMessage({
        projectId: req.params.id,
        userId,
        role: "assistant",
        content: aiResponseContent,
        agentType,
      });

      // Broadcast via WebSocket
      wsService.sendChatMessage(req.params.id, {
        messageId: aiResponse.id,
        senderId: userId,
        content: aiResponse.content,
        role: "assistant",
        agentType: aiResponse.agentType || undefined,
      });

      res.status(201).json({ userMessage, aiResponse });
    } catch (error: any) {
      console.error("Error in AI chat:", error);
      res.status(400).json({ message: error.message || "Failed to process message" });
    }
  });

  // AI Configuration endpoints
  app.get("/api/ai/status", isAuthenticated, async (req: any, res) => {
    try {
      const ollamaAvailable = await aiProvider.isOllamaAvailable();
      const ollamaModels = ollamaAvailable ? await aiProvider.listOllamaModels() : [];
      const providerStatus = aiProvider.getProviderStatus();
      const currentConfig = agentOrchestrator.getCurrentConfig();
      
      res.json({
        activeProvider: currentConfig.type,
        activeModel: currentConfig.model,
        providers: {
          ollama: { available: ollamaAvailable, models: ollamaModels },
          gemini: { available: providerStatus.gemini },
          openai: { available: providerStatus.openai }
        },
        recommendedModels: RECOMMENDED_MODELS,
        agentPersonas: agentOrchestrator.getAgentPersonas()
      });
    } catch (error) {
      console.error("Error checking AI status:", error);
      res.status(500).json({ message: "Failed to check AI status" });
    }
  });

  app.post("/api/ai/configure", isAdmin, async (req: any, res) => {
    try {
      const { provider, baseUrl, model } = req.body;
      
      // Validate provider
      const allowedProviders = ['ollama', 'lmstudio', 'gemini', 'openai'];
      if (!allowedProviders.includes(provider)) {
        return res.status(400).json({ message: "Invalid provider" });
      }
      
      // Validate and sanitize baseUrl (only allow localhost for local providers)
      let sanitizedBaseUrl = baseUrl;
      if (baseUrl && (provider === 'ollama' || provider === 'lmstudio')) {
        try {
          const url = new URL(baseUrl);
          // Only allow localhost connections for security
          if (!['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)) {
            return res.status(400).json({ message: "Only localhost URLs are allowed for local providers" });
          }
          sanitizedBaseUrl = url.toString();
        } catch {
          return res.status(400).json({ message: "Invalid URL format" });
        }
      }
      
      // Validate model name (alphanumeric, dots, colons, hyphens only)
      if (model && !/^[\w\-.:]+$/.test(model)) {
        return res.status(400).json({ message: "Invalid model name" });
      }
      
      agentOrchestrator.setProviderConfig({
        type: provider,
        baseUrl: sanitizedBaseUrl,
        model
      });
      
      res.json({ message: "AI configuration updated", provider, model });
    } catch (error) {
      console.error("Error configuring AI:", error);
      res.status(500).json({ message: "Failed to configure AI" });
    }
  });

  app.get("/api/projects/:id/ai-context", isAuthenticated, async (req: any, res) => {
    try {
      const context = agentOrchestrator.getContext(req.params.id);
      res.json(context || null);
    } catch (error) {
      console.error("Error getting AI context:", error);
      res.status(500).json({ message: "Failed to get AI context" });
    }
  });

  // Messages (between user and programmer)
  app.get("/api/projects/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesByProjectId(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/projects/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const project = await storage.getProject(req.params.id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const data = insertMessageSchema.parse({
        projectId: req.params.id,
        senderId: userId,
        messageText: req.body.messageText,
      });

      const message = await storage.createMessage(data);
      
      // Broadcast message via WebSocket
      wsService.sendChatMessage(req.params.id, {
        messageId: message.id,
        senderId: message.senderId,
        content: message.messageText,
        role: "user",
      });

      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error creating message:", error);
      res.status(400).json({ message: error.message || "Failed to send message" });
    }
  });

  // Tasks
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const tasks = await storage.getAvailableTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/projects/:id/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const tasks = await storage.getTasksByProjectId(req.params.id);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Transactions
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const transactions = await storage.getTransactionsByUserId(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions/topup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const { amount } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Update user balance
      const user = await storage.updateUserBalance(userId, amount);
      
      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "topup",
        amount,
        description: "Account top-up",
        balanceAfter: user?.balance || "0",
      });

      res.json({ message: "Top-up successful", balance: user?.balance });
    } catch (error) {
      console.error("Error processing top-up:", error);
      res.status(500).json({ message: "Failed to process top-up" });
    }
  });

  // Programmer routes
  app.get("/api/programmer/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const programmer = await storage.getProgrammerByUserId(userId);
      
      if (!programmer) {
        return res.status(404).json({ message: "Programmer profile not found" });
      }
      
      res.json(programmer);
    } catch (error) {
      console.error("Error fetching programmer profile:", error);
      res.status(500).json({ message: "Failed to fetch programmer profile" });
    }
  });

  app.patch("/api/programmer/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const programmer = await storage.getProgrammerByUserId(userId);
      
      if (!programmer) {
        return res.status(404).json({ message: "Programmer profile not found" });
      }

      const updated = await storage.updateProgrammer(programmer.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating programmer profile:", error);
      res.status(500).json({ message: "Failed to update programmer profile" });
    }
  });

  app.get("/api/programmer/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const programmer = await storage.getProgrammerByUserId(userId);
      
      if (!programmer) {
        return res.json([]);
      }

      const projects = await storage.getProjectsByProgrammerId(programmer.id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching programmer projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/programmer/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const programmer = await storage.getProgrammerByUserId(userId);
      
      if (!programmer) {
        return res.json([]);
      }

      const tasks = await storage.getTasksByProgrammerId(programmer.id);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching programmer tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/programmer/available-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const tasks = await storage.getAvailableTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching available tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/programmer/accept-task/:id", isProgrammer, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const programmer = await storage.getProgrammerByUserId(userId);
      
      if (!programmer) {
        return res.status(404).json({ message: "Programmer profile not found" });
      }

      if (!programmer.isApproved) {
        return res.status(403).json({ message: "Your account is pending approval" });
      }

      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.status !== "pending") {
        return res.status(400).json({ message: "Task is no longer available" });
      }

      await storage.updateTask(req.params.id, {
        programmerId: programmer.id,
        status: "in_progress",
        startTime: new Date(),
      });

      // Update project status
      if (task.projectId) {
        await storage.updateProject(task.projectId, {
          status: "in_progress",
          programmerId: programmer.id,
        });
      }

      res.json({ message: "Task accepted" });
    } catch (error) {
      console.error("Error accepting task:", error);
      res.status(500).json({ message: "Failed to accept task" });
    }
  });

  // Admin routes
  app.get("/api/admin/pending-programmers", isAdmin, async (req: any, res) => {
    try {
      const programmers = await storage.getPendingProgrammers();
      res.json(programmers);
    } catch (error) {
      console.error("Error fetching pending programmers:", error);
      res.status(500).json({ message: "Failed to fetch programmers" });
    }
  });

  app.post("/api/admin/approve-programmer/:id", isAdmin, async (req: any, res) => {
    try {
      const programmer = await storage.getProgrammer(req.params.id);
      if (!programmer) {
        return res.status(404).json({ message: "Programmer not found" });
      }

      await storage.updateProgrammer(req.params.id, { isApproved: true });
      res.json({ message: "Programmer approved" });
    } catch (error) {
      console.error("Error approving programmer:", error);
      res.status(500).json({ message: "Failed to approve programmer" });
    }
  });

  // CryptAPI USDT TRC20 Payment Routes
  const CRYPTAPI_USDT_ADDRESS = "TCZwoWnmi8uBssqjtKGmUwAjToAxcJkjLP";
  const CRYPTAPI_COIN = "trc20/usdt";
  const CALLBACK_SECRET = process.env.CRYPTAPI_CALLBACK_SECRET;

  app.post("/api/crypto/create-payment", isAuthenticated, async (req: any, res) => {
    try {
      if (!CALLBACK_SECRET || CALLBACK_SECRET.length < 32) {
        console.error("CRYPTAPI_CALLBACK_SECRET not configured or too weak");
        return res.status(500).json({ message: "Payment system not configured" });
      }
      
      const userId = req.currentUser?.id;
      const { amount } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const callbackUrl = `${req.protocol}://${req.get("host")}/api/crypto/callback?secret=${CALLBACK_SECRET}`;
      
      const cryptapiUrl = `https://api.cryptapi.io/${CRYPTAPI_COIN}/create/?callback=${encodeURIComponent(callbackUrl)}&address=${CRYPTAPI_USDT_ADDRESS}&pending=1&confirmations=1&post=1`;
      
      const response = await fetch(cryptapiUrl);
      const data = await response.json();

      if (data.status === "success" && data.address_in) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const payment = await storage.createCryptoPayment({
          userId,
          addressIn: data.address_in,
          addressOut: CRYPTAPI_USDT_ADDRESS,
          coin: CRYPTAPI_COIN,
          amountRequested: amount,
          callbackUrl,
          expiresAt,
          status: "waiting",
        });

        res.json({
          success: true,
          paymentId: payment.id,
          addressIn: data.address_in,
          amount: amount,
          coin: "USDT (TRC20)",
          expiresAt: expiresAt.toISOString(),
          qrCode: `https://api.cryptapi.io/${CRYPTAPI_COIN}/qrcode/?address=${data.address_in}&value=${amount}`,
        });
      } else {
        console.error("CryptAPI error:", data);
        res.status(500).json({ message: "Failed to create payment address" });
      }
    } catch (error) {
      console.error("Error creating crypto payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.get("/api/crypto/payments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const payments = await storage.getCryptoPaymentsByUserId(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching crypto payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/crypto/payment/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const payment = await storage.getCryptoPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      if (payment.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json({
        id: payment.id,
        status: payment.status,
        amountRequested: payment.amountRequested,
        amountReceived: payment.amountReceived,
        confirmations: payment.confirmations,
        createdAt: payment.createdAt,
        confirmedAt: payment.confirmedAt,
      });
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  app.post("/api/crypto/callback", async (req, res) => {
    try {
      const callbackSecret = req.query.secret;
      
      if (callbackSecret !== CALLBACK_SECRET) {
        console.error("Invalid callback secret - possible spoofed callback");
        return res.status(401).send("Unauthorized");
      }
      
      const { 
        address_in, 
        address_out, 
        txid_in, 
        value_coin, 
        confirmations, 
        pending 
      } = req.body;

      console.log("CryptAPI Callback received:", req.body);

      if (address_out !== CRYPTAPI_USDT_ADDRESS) {
        console.error("Invalid address_out - possible spoofed callback:", address_out);
        return res.send("*ok*");
      }

      const payment = await storage.getCryptoPaymentByAddress(address_in);
      
      if (!payment) {
        console.error("Payment not found for address:", address_in);
        return res.send("*ok*");
      }

      if (payment.status === "confirmed") {
        console.log("Payment already confirmed, skipping:", payment.id);
        return res.send("*ok*");
      }

      const valueReceived = parseFloat(value_coin) || 0;
      const amountRequested = parseFloat(payment.amountRequested || "0");
      const newConfirmations = parseInt(confirmations) || 0;
      const isPending = pending === "1" || pending === 1;

      if (valueReceived <= 0) {
        console.error("Invalid value received:", value_coin);
        return res.send("*ok*");
      }

      const tolerance = 0.01;
      const isValidAmount = valueReceived >= (amountRequested - tolerance);

      let newStatus = payment.status;
      if (isPending) {
        newStatus = "confirming";
      } else if (newConfirmations >= 1 && isValidAmount) {
        newStatus = "confirmed";
      } else if (newConfirmations >= 1 && !isValidAmount) {
        console.warn(`Insufficient amount: received ${valueReceived}, requested ${amountRequested}`);
        newStatus = "partial";
      }

      if (newStatus === "confirmed") {
        const result = await storage.confirmPaymentAtomically(
          payment.id,
          valueReceived.toString(),
          txid_in,
          newConfirmations
        );
        
        if (result.success) {
          console.log(`Balance updated atomically for user ${payment.userId}: +${valueReceived} USDT`);
        } else {
          console.log(`Payment ${payment.id} already confirmed, skipping credit`);
        }
      } else {
        await storage.updateCryptoPayment(payment.id, {
          amountReceived: valueReceived.toString(),
          txidIn: txid_in,
          confirmations: newConfirmations,
          status: newStatus,
        });
      }

      res.send("*ok*");
    } catch (error) {
      console.error("Error processing crypto callback:", error);
      res.send("*ok*");
    }
  });

  app.get("/api/crypto/check-payment/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const payment = await storage.getCryptoPayment(req.params.id);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (payment.status === "waiting" && payment.addressIn) {
        const logsUrl = `https://api.cryptapi.io/${CRYPTAPI_COIN}/logs/?callback=${encodeURIComponent(payment.callbackUrl || "")}&address=${payment.addressIn}`;
        
        try {
          const response = await fetch(logsUrl);
          const data = await response.json();
          
          if (data.status === "success" && data.callbacks && data.callbacks.length > 0) {
            const latestCallback = data.callbacks[data.callbacks.length - 1];
            const valueReceived = parseFloat(latestCallback.value_coin) || 0;
            const confirmations = parseInt(latestCallback.confirmations) || 0;
            
            const freshPayment = await storage.getCryptoPayment(payment.id);
            const amountRequested = parseFloat(payment.amountRequested || "0");
            const tolerance = 0.01;
            const isValidAmount = valueReceived >= (amountRequested - tolerance);
            
            if (confirmations >= 1 && valueReceived > 0 && isValidAmount && freshPayment?.status !== "confirmed") {
              const result = await storage.confirmPaymentAtomically(
                payment.id,
                valueReceived.toString(),
                latestCallback.txid_in,
                confirmations
              );
              
              if (result.success) {
                console.log(`Balance updated atomically for user ${payment.userId}: +${valueReceived} USDT`);
              }
            } else if (confirmations >= 1 && valueReceived > 0 && !isValidAmount && freshPayment?.status !== "confirmed") {
              await storage.updateCryptoPayment(payment.id, {
                amountReceived: valueReceived.toString(),
                txidIn: latestCallback.txid_in,
                confirmations,
                status: "partial",
              });
            } else if (confirmations > 0 && freshPayment?.status !== "confirmed") {
              await storage.updateCryptoPayment(payment.id, {
                confirmations,
                status: "confirming",
              });
            }
          }
        } catch (checkError) {
          console.error("Error checking payment status:", checkError);
        }
      }

      const updatedPayment = await storage.getCryptoPayment(req.params.id);
      res.json(updatedPayment);
    } catch (error) {
      console.error("Error checking payment:", error);
      res.status(500).json({ message: "Failed to check payment" });
    }
  });

  // Template routes
  app.get("/api/templates", async (req, res) => {
    try {
      let templates = await storage.getTemplates();
      
      if (templates.length === 0) {
        const defaultTemplates = [
          {
            name: "React + TypeScript",
            description: "Modern React application with TypeScript, Tailwind CSS, and Vite bundler. Perfect for building responsive web applications.",
            category: "Frontend",
            icon: "react",
            language: "TypeScript",
            framework: "React",
            featured: true,
            starterFiles: [
              { filename: "src/App.tsx", content: `import { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="min-h-screen flex items-center justify-center bg-gray-100">\n      <div className="text-center">\n        <h1 className="text-4xl font-bold mb-4">React + TypeScript</h1>\n        <button\n          onClick={() => setCount(c => c + 1)}\n          className="px-4 py-2 bg-blue-500 text-white rounded"\n        >\n          Count: {count}\n        </button>\n      </div>\n    </div>\n  );\n}` },
              { filename: "src/index.css", content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;` },
            ],
          },
          {
            name: "Node.js Express API",
            description: "RESTful API server built with Express.js and TypeScript. Includes authentication, validation, and database integration.",
            category: "Backend",
            icon: "server",
            language: "TypeScript",
            framework: "Express",
            featured: true,
            starterFiles: [
              { filename: "src/server.ts", content: `import express from 'express';\nimport cors from 'cors';\n\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', timestamp: new Date().toISOString() });\n});\n\napp.get('/api/users', (req, res) => {\n  res.json({ users: [] });\n});\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => {\n  console.log(\`Server running on port \${PORT}\`);\n});` },
              { filename: "src/routes/index.ts", content: `import { Router } from 'express';\n\nconst router = Router();\n\nrouter.get('/', (req, res) => {\n  res.json({ message: 'API is running' });\n});\n\nexport default router;` },
            ],
          },
          {
            name: "Full Stack (React + Express)",
            description: "Complete full-stack application with React frontend and Express backend. Includes API integration, state management, and database support.",
            category: "Full Stack",
            icon: "layers",
            language: "TypeScript",
            framework: "React + Express",
            featured: true,
            starterFiles: [
              { filename: "client/src/App.tsx", content: `import { useEffect, useState } from 'react';\n\nexport default function App() {\n  const [data, setData] = useState(null);\n\n  useEffect(() => {\n    fetch('/api/health')\n      .then(res => res.json())\n      .then(setData);\n  }, []);\n\n  return (\n    <div className="p-8">\n      <h1 className="text-3xl font-bold">Full Stack App</h1>\n      <pre className="mt-4 p-4 bg-gray-100 rounded">\n        {JSON.stringify(data, null, 2)}\n      </pre>\n    </div>\n  );\n}` },
              { filename: "server/index.ts", content: `import express from 'express';\n\nconst app = express();\napp.use(express.json());\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'healthy' });\n});\n\napp.listen(5000, () => console.log('Server started'));` },
            ],
          },
          {
            name: "Python Flask API",
            description: "Python REST API with Flask framework. Includes SQLAlchemy ORM, JWT authentication, and request validation.",
            category: "Backend",
            icon: "terminal",
            language: "Python",
            framework: "Flask",
            featured: false,
            starterFiles: [
              { filename: "app.py", content: `from flask import Flask, jsonify, request\nfrom flask_cors import CORS\n\napp = Flask(__name__)\nCORS(app)\n\n@app.route('/api/health')\ndef health():\n    return jsonify({'status': 'ok'})\n\n@app.route('/api/users', methods=['GET'])\ndef get_users():\n    return jsonify({'users': []})\n\nif __name__ == '__main__':\n    app.run(debug=True, port=5000)` },
              { filename: "requirements.txt", content: `flask==3.0.0\nflask-cors==4.0.0\nsqlalchemy==2.0.23\npython-dotenv==1.0.0` },
            ],
          },
          {
            name: "Next.js Application",
            description: "Server-side rendered React application with Next.js 14. Includes App Router, API routes, and optimized performance.",
            category: "Full Stack",
            icon: "zap",
            language: "TypeScript",
            framework: "Next.js",
            featured: true,
            starterFiles: [
              { filename: "app/page.tsx", content: `export default function Home() {\n  return (\n    <main className="min-h-screen p-24">\n      <h1 className="text-4xl font-bold mb-4">\n        Welcome to Next.js\n      </h1>\n      <p className="text-gray-600">\n        Get started by editing app/page.tsx\n      </p>\n    </main>\n  );\n}` },
              { filename: "app/api/hello/route.ts", content: `import { NextResponse } from 'next/server';\n\nexport async function GET() {\n  return NextResponse.json({ message: 'Hello from Next.js!' });\n}` },
            ],
          },
          {
            name: "Vue.js SPA",
            description: "Single Page Application with Vue 3 and Composition API. Includes Vue Router, Pinia state management, and Tailwind CSS.",
            category: "Frontend",
            icon: "layout",
            language: "TypeScript",
            framework: "Vue.js",
            featured: false,
            starterFiles: [
              { filename: "src/App.vue", content: `<script setup lang="ts">\nimport { ref } from 'vue';\n\nconst count = ref(0);\n</script>\n\n<template>\n  <div class="min-h-screen flex items-center justify-center">\n    <div class="text-center">\n      <h1 class="text-4xl font-bold mb-4">Vue 3 + TypeScript</h1>\n      <button\n        @click="count++"\n        class="px-4 py-2 bg-green-500 text-white rounded"\n      >\n        Count: {{ count }}\n      </button>\n    </div>\n  </div>\n</template>` },
              { filename: "src/main.ts", content: `import { createApp } from 'vue';\nimport App from './App.vue';\nimport './style.css';\n\ncreateApp(App).mount('#app');` },
            ],
          },
        ];

        for (const t of defaultTemplates) {
          await storage.createTemplate(t);
        }

        templates = await storage.getTemplates();
      }

      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/projects/from-template/:templateId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const template = await storage.getTemplate(req.params.templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const { title, description, budget } = req.body;

      const project = await storage.createProject({
        userId,
        title: title || `${template.name} Project`,
        description: description || template.description,
        requirements: `Based on ${template.name} template (${template.framework})`,
        budget: budget || "100",
        status: "pending",
      });

      for (const file of template.starterFiles) {
        await storage.createFile({
          projectId: project.id,
          filename: file.filename,
          content: file.content,
          linesCount: file.content.split('\n').length,
          size: file.content.length,
          status: "completed",
          agentType: "template",
        });
      }

      res.status(201).json(project);
    } catch (error: any) {
      console.error("Error creating project from template:", error);
      res.status(400).json({ message: error.message || "Failed to create project from template" });
    }
  });

  // Pricing routes
  app.get("/api/pricing", async (req, res) => {
    try {
      const allPricing = await storage.getAllPricing();
      
      if (allPricing.length === 0) {
        const defaultPricing = [
          { agentType: "ui_ux", unit: "file", rate: "2.50", description: "UI/UX Agent - per file" },
          { agentType: "backend", unit: "file", rate: "3.00", description: "Backend Agent - per file" },
          { agentType: "database", unit: "file", rate: "2.00", description: "Database Agent - per file" },
          { agentType: "qa", unit: "file", rate: "1.50", description: "QA Agent - per file" },
          { agentType: "devops", unit: "file", rate: "2.00", description: "DevOps Agent - per file" },
          { agentType: "human", unit: "line", rate: "0.10", description: "Human Programmer - per line" },
          { agentType: "human", unit: "hour", rate: "25.00", description: "Human Programmer - per hour" },
        ];

        for (const p of defaultPricing) {
          await storage.createPricing(p);
        }

        const pricing = await storage.getAllPricing();
        return res.json(pricing);
      }

      res.json(allPricing);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });

  // ===== WORKSPACE ROUTES =====
  
  // Initialize workspace for a project
  app.post("/api/workspace/:projectId/init", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Initialize workspace directory if it doesn't exist
      const exists = await workspaceService.workspaceExists(projectId);
      if (!exists) {
        await workspaceService.createWorkspace(projectId, "react");
      }
      
      // Sync files from database to filesystem
      const files = await storage.getFiles(projectId);
      for (const file of files) {
        await workspaceService.writeFile(projectId, file.filename, file.content);
      }
      
      res.json({ success: true, message: "Workspace initialized" });
    } catch (error: any) {
      console.error("Error initializing workspace:", error);
      res.status(500).json({ message: error.message || "Failed to initialize workspace" });
    }
  });
  
  // List files in workspace
  app.get("/api/workspace/:projectId/files", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const path = req.query.path as string || "";
      
      const entries = await workspaceService.listFiles(projectId, path);
      res.json(entries);
    } catch (error: any) {
      console.error("Error listing workspace files:", error);
      res.status(500).json({ message: error.message || "Failed to list files" });
    }
  });
  
  // Read file from workspace
  app.get("/api/workspace/:projectId/file", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const filePath = req.query.path as string;
      
      if (!filePath) {
        return res.status(400).json({ message: "File path required" });
      }
      
      const content = await workspaceService.readFile(projectId, filePath);
      res.json({ content, path: filePath });
    } catch (error: any) {
      console.error("Error reading file:", error);
      res.status(500).json({ message: error.message || "Failed to read file" });
    }
  });
  
  // Write file to workspace
  app.post("/api/workspace/:projectId/file", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const { path: filePath, content } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ message: "File path required" });
      }
      
      await workspaceService.writeFile(projectId, filePath, content || "");
      
      // Also sync to database
      const existingFile = await storage.getFileByName(projectId, filePath);
      if (existingFile) {
        await storage.updateFile(existingFile.id, {
          content,
          linesCount: content.split('\n').length,
          size: content.length,
        });
      } else {
        await storage.createFile({
          projectId,
          filename: filePath,
          content,
          linesCount: content.split('\n').length,
          size: content.length,
          status: "completed",
          agentType: "manual",
        });
      }
      
      // Notify via WebSocket
      wsService.sendFileChanged(projectId, {
        path: filePath,
        action: existingFile ? "modified" : "created",
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error writing file:", error);
      res.status(500).json({ message: error.message || "Failed to write file" });
    }
  });
  
  // Delete file from workspace
  app.delete("/api/workspace/:projectId/file", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const filePath = req.query.path as string;
      
      if (!filePath) {
        return res.status(400).json({ message: "File path required" });
      }
      
      await workspaceService.deleteFile(projectId, filePath);
      
      // Also remove from database
      const existingFile = await storage.getFileByName(projectId, filePath);
      if (existingFile) {
        await storage.deleteFile(existingFile.id);
      }
      
      // Notify via WebSocket
      wsService.sendFileChanged(projectId, {
        path: filePath,
        action: "deleted",
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: error.message || "Failed to delete file" });
    }
  });
  
  // Create folder in workspace
  app.post("/api/workspace/:projectId/folder", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const { path: folderPath } = req.body;
      
      if (!folderPath) {
        return res.status(400).json({ message: "Folder path required" });
      }
      
      await workspaceService.createDirectory(projectId, folderPath);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: error.message || "Failed to create folder" });
    }
  });
  
  // Delete folder from workspace
  app.delete("/api/workspace/:projectId/folder", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const folderPath = req.query.path as string;
      
      if (!folderPath) {
        return res.status(400).json({ message: "Folder path required" });
      }
      
      await workspaceService.deleteFile(projectId, folderPath);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: error.message || "Failed to delete folder" });
    }
  });
  
  // Rename file or folder
  app.patch("/api/workspace/:projectId/rename", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const { oldPath, newPath } = req.body;
      
      if (!oldPath || !newPath) {
        return res.status(400).json({ message: "Both old and new paths required" });
      }
      
      await workspaceService.renameFile(projectId, oldPath, newPath);
      
      // Also update in database
      const existingFile = await storage.getFileByName(projectId, oldPath);
      if (existingFile) {
        await storage.updateFile(existingFile.id, { filename: newPath });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error renaming:", error);
      res.status(500).json({ message: error.message || "Failed to rename" });
    }
  });

  // ===== PROCESS ROUTES =====
  
  // Start dev server for a project
  app.post("/api/process/:projectId/start", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const { command } = req.body;
      
      const info = await processManager.startDevServer(projectId, command);
      res.json(info);
    } catch (error: any) {
      console.error("Error starting process:", error);
      res.status(500).json({ message: error.message || "Failed to start process" });
    }
  });
  
  // Stop process for a project
  app.post("/api/process/:projectId/stop", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      
      await processManager.stopProcess(projectId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error stopping process:", error);
      res.status(500).json({ message: error.message || "Failed to stop process" });
    }
  });
  
  // Get process status
  app.get("/api/process/:projectId/status", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      
      const info = processManager.getProcessInfo(projectId);
      res.json(info || { status: "stopped" });
    } catch (error: any) {
      console.error("Error getting process status:", error);
      res.status(500).json({ message: error.message || "Failed to get status" });
    }
  });
  
  // Get preview URL for a project
  app.get("/api/preview/:projectId", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      
      const url = getPreviewUrl(projectId);
      const available = isPreviewAvailable(projectId);
      
      res.json({ url, available });
    } catch (error: any) {
      console.error("Error getting preview URL:", error);
      res.status(500).json({ message: error.message || "Failed to get preview URL" });
    }
  });

}

// Helper function to generate AI responses (simulated)
function generateAIResponse(userMessage: string, project: any): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes("help") || lowerMessage.includes("مساعدة")) {
    return `I'm here to help you with your project "${project.title}". I can:\n\n1. Analyze your requirements\n2. Generate code\n3. Create database schemas\n4. Write tests\n5. Set up deployment\n\nWhat would you like me to work on?`;
  }
  
  if (lowerMessage.includes("start") || lowerMessage.includes("ابدأ")) {
    return `Let's start working on your project! I'll coordinate with our 5 AI agents:\n\n- UI/UX Agent: Will design the interface\n- Backend Agent: Will create the API\n- Database Agent: Will set up data models\n- QA Agent: Will write tests\n- DevOps Agent: Will handle deployment\n\nShall I begin the AI processing?`;
  }
  
  if (lowerMessage.includes("human") || lowerMessage.includes("programmer") || lowerMessage.includes("بشري") || lowerMessage.includes("مبرمج")) {
    return `I understand you'd like human assistance. I can request a professional programmer to help with your project. They can:\n\n1. Review and improve AI-generated code\n2. Handle complex custom requirements\n3. Provide expert guidance\n\nWould you like me to request a human programmer?`;
  }
  
  if (lowerMessage.includes("status") || lowerMessage.includes("حالة")) {
    return `Project Status: ${project.status}\n\nCurrent Progress:\n- Files Generated: Check the Files tab\n- Budget Used: $${project.spent || "0.00"}\n- Total Budget: $${project.budget || "0.00"}\n\nWould you like me to continue working on any specific part?`;
  }
  
  return `I understand your request. I'm analyzing your project "${project.title}" and will coordinate with our AI agents to help you.\n\nBased on your message, I'll work on implementing the required features. Would you like me to start the AI processing or do you have specific requirements to discuss first?`;
}
