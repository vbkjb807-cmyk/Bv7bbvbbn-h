// Multi-Agent Orchestrator with Shared Memory
// Coordinates 5 AI agents that communicate and share context

import { aiProvider, AIMessage, AIProviderConfig, RECOMMENDED_MODELS } from './aiProvider';
import { wsService } from './websocket';

// Agent Types
export type AgentType = 'ui_ux' | 'backend' | 'database' | 'qa' | 'devops';

// Shared Memory for project context
export interface ProjectContext {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  projectType: string;
  techStack?: string[];
  currentPhase: 'analysis' | 'design' | 'implementation' | 'testing' | 'deployment';
  
  // Shared knowledge between agents
  sharedMemory: {
    requirements: string[];
    decisions: Array<{ agent: AgentType; decision: string; reason: string }>;
    codeArtifacts: Array<{ agent: AgentType; filename: string; description: string; content?: string }>;
    agentMessages: Array<{ from: AgentType; to: AgentType | 'all'; message: string; timestamp: number }>;
    issues: Array<{ agent: AgentType; issue: string; resolved: boolean }>;
  };
  
  // Agent states
  agentStates: Record<AgentType, {
    status: 'idle' | 'thinking' | 'working' | 'completed' | 'error';
    currentTask?: string;
    progress: number;
    lastOutput?: string;
  }>;
}

// Agent Personas with specialized prompts
const AGENT_PERSONAS: Record<AgentType, { name: string; nameAr: string; role: string; expertise: string[]; systemPrompt: string }> = {
  ui_ux: {
    name: 'UI/UX Agent',
    nameAr: 'وكيل الواجهات',
    role: 'Frontend & Design Specialist',
    expertise: ['React', 'Vue', 'CSS', 'Tailwind', 'Accessibility', 'Responsive Design'],
    systemPrompt: `You are an expert UI/UX developer agent. Your responsibilities:
- Design beautiful, accessible, and responsive user interfaces
- Write clean React/Vue components with TypeScript
- Implement modern CSS using Tailwind CSS
- Ensure excellent user experience and accessibility (WCAG)
- Collaborate with Backend Agent for API integration
- Communicate design decisions to other agents

When generating code:
- Use modern React patterns (hooks, functional components)
- Include proper TypeScript types
- Add data-testid attributes for testing
- Follow component best practices

Always explain your design decisions and how they affect other parts of the system.`
  },
  
  backend: {
    name: 'Backend Agent',
    nameAr: 'وكيل الخادم',
    role: 'Server & API Specialist',
    expertise: ['Node.js', 'Express', 'REST API', 'GraphQL', 'Authentication', 'Security'],
    systemPrompt: `You are an expert Backend developer agent. Your responsibilities:
- Design and implement robust REST/GraphQL APIs
- Handle authentication, authorization, and security
- Write efficient server-side logic with Node.js/Express
- Coordinate with Database Agent for data operations
- Provide API contracts to UI/UX Agent

When generating code:
- Follow RESTful best practices
- Include proper error handling
- Add input validation using Zod
- Implement security best practices
- Document API endpoints clearly

Always communicate API changes to UI/UX Agent and data requirements to Database Agent.`
  },
  
  database: {
    name: 'Database Agent',
    nameAr: 'وكيل قواعد البيانات',
    role: 'Data & Schema Specialist',
    expertise: ['PostgreSQL', 'MongoDB', 'Redis', 'Schema Design', 'Queries', 'Optimization'],
    systemPrompt: `You are an expert Database architect agent. Your responsibilities:
- Design efficient database schemas
- Write optimized queries and indexes
- Handle data migrations safely
- Coordinate with Backend Agent for data access patterns
- Ensure data integrity and consistency

When generating code:
- Use proper normalization/denormalization based on use case
- Add appropriate indexes for common queries
- Include migration scripts
- Document schema relationships

Always communicate schema changes to Backend Agent and consider data access patterns.`
  },
  
  qa: {
    name: 'QA Agent',
    nameAr: 'وكيل الجودة',
    role: 'Testing & Quality Specialist',
    expertise: ['Jest', 'Playwright', 'Unit Testing', 'E2E Testing', 'Code Review', 'Bug Detection'],
    systemPrompt: `You are an expert QA engineer agent. Your responsibilities:
- Write comprehensive test suites (unit, integration, E2E)
- Review code from other agents for bugs and issues
- Ensure code quality and maintainability
- Create test plans based on requirements
- Report issues to relevant agents

When generating code:
- Write thorough test cases covering edge cases
- Use Jest for unit tests, Playwright for E2E
- Include descriptive test names
- Test error handling paths

Always review other agents' code and report potential issues proactively.`
  },
  
  devops: {
    name: 'DevOps Agent',
    nameAr: 'وكيل البنية التحتية',
    role: 'Infrastructure & Deployment Specialist',
    expertise: ['Docker', 'CI/CD', 'Cloud', 'Monitoring', 'Performance', 'Security'],
    systemPrompt: `You are an expert DevOps engineer agent. Your responsibilities:
- Design deployment infrastructure
- Create Docker configurations
- Set up CI/CD pipelines
- Configure monitoring and logging
- Optimize performance and security

When generating code:
- Create production-ready configurations
- Include health checks and monitoring
- Follow security best practices
- Document deployment procedures

Always coordinate with all agents on deployment requirements and environment configurations.`
  }
};

// Main Orchestrator Class
class AgentOrchestrator {
  private contexts: Map<string, ProjectContext> = new Map();
  private aiConfig: Partial<AIProviderConfig> = {};

  constructor() {
    // Default to Gemini API for real AI processing
    this.aiConfig = {
      type: 'gemini',
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 8192
    };
  }

  // Initialize context for a project
  initializeContext(projectId: string, project: { title: string; description: string; projectType: string }): ProjectContext {
    const context: ProjectContext = {
      projectId,
      projectTitle: project.title,
      projectDescription: project.description,
      projectType: project.projectType,
      currentPhase: 'analysis',
      sharedMemory: {
        requirements: [],
        decisions: [],
        codeArtifacts: [],
        agentMessages: [],
        issues: []
      },
      agentStates: {
        ui_ux: { status: 'idle', progress: 0 },
        backend: { status: 'idle', progress: 0 },
        database: { status: 'idle', progress: 0 },
        qa: { status: 'idle', progress: 0 },
        devops: { status: 'idle', progress: 0 }
      }
    };
    
    this.contexts.set(projectId, context);
    return context;
  }

  getContext(projectId: string): ProjectContext | undefined {
    return this.contexts.get(projectId);
  }

  // Build context-aware prompt for an agent
  private buildAgentPrompt(agent: AgentType, context: ProjectContext, userMessage: string): AIMessage[] {
    const persona = AGENT_PERSONAS[agent];
    const messages: AIMessage[] = [];

    // System prompt with persona
    let systemPrompt = persona.systemPrompt;
    
    // Add project context
    systemPrompt += `\n\n## Current Project Context
- Project: ${context.projectTitle}
- Description: ${context.projectDescription}
- Type: ${context.projectType}
- Phase: ${context.currentPhase}`;

    // Add shared memory context
    if (context.sharedMemory.requirements.length > 0) {
      systemPrompt += `\n\n## Known Requirements:\n${context.sharedMemory.requirements.map(r => `- ${r}`).join('\n')}`;
    }

    if (context.sharedMemory.decisions.length > 0) {
      systemPrompt += `\n\n## Team Decisions:\n${context.sharedMemory.decisions.slice(-5).map(d => `- [${d.agent}]: ${d.decision}`).join('\n')}`;
    }

    // Add recent inter-agent messages
    const recentMessages = context.sharedMemory.agentMessages.slice(-10);
    if (recentMessages.length > 0) {
      systemPrompt += `\n\n## Recent Team Communication:\n${recentMessages.map(m => `[${m.from} -> ${m.to}]: ${m.message}`).join('\n')}`;
    }

    // Add issues relevant to this agent
    const myIssues = context.sharedMemory.issues.filter(i => i.agent === agent && !i.resolved);
    if (myIssues.length > 0) {
      systemPrompt += `\n\n## Issues to Address:\n${myIssues.map(i => `- ${i.issue}`).join('\n')}`;
    }

    messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  // Single agent thinking
  async agentThink(projectId: string, agent: AgentType, task: string): Promise<string> {
    const context = this.contexts.get(projectId);
    if (!context) throw new Error('Project context not found');

    // Update agent state
    context.agentStates[agent] = { 
      status: 'thinking', 
      currentTask: task, 
      progress: 10 
    };
    this.broadcastAgentStatus(projectId, agent, context.agentStates[agent]);

    try {
      const messages = this.buildAgentPrompt(agent, context, task);
      // Use Gemini model for all agents
      const modelConfig = { ...this.aiConfig };
      
      const response = await aiProvider.chat(messages, modelConfig);

      // Update state to working
      context.agentStates[agent] = { 
        status: 'working', 
        currentTask: task, 
        progress: 50,
        lastOutput: response.content.substring(0, 200)
      };
      this.broadcastAgentStatus(projectId, agent, context.agentStates[agent]);

      return response.content;
    } catch (error: any) {
      context.agentStates[agent] = { 
        status: 'error', 
        currentTask: task, 
        progress: 0 
      };
      this.broadcastAgentStatus(projectId, agent, context.agentStates[agent]);
      throw error;
    }
  }

  // Inter-agent communication
  agentMessage(projectId: string, from: AgentType, to: AgentType | 'all', message: string): void {
    const context = this.contexts.get(projectId);
    if (!context) return;

    context.sharedMemory.agentMessages.push({
      from,
      to,
      message,
      timestamp: Date.now()
    });

    // Broadcast to WebSocket
    wsService.broadcastToProject(projectId, {
      type: 'agent:message',
      projectId,
      data: { from, to, message },
      timestamp: Date.now()
    });
  }

  // Add a decision to shared memory
  addDecision(projectId: string, agent: AgentType, decision: string, reason: string): void {
    const context = this.contexts.get(projectId);
    if (!context) return;

    context.sharedMemory.decisions.push({ agent, decision, reason });
  }

  // Report an issue
  reportIssue(projectId: string, agent: AgentType, issue: string): void {
    const context = this.contexts.get(projectId);
    if (!context) return;

    context.sharedMemory.issues.push({ agent, issue, resolved: false });
  }

  // Collaborative processing - all agents work together
  async processProjectCollaboratively(projectId: string, userRequest: string): Promise<{
    orchestratorResponse: string;
    agentContributions: Array<{ agent: AgentType; contribution: string }>;
  }> {
    const context = this.contexts.get(projectId);
    if (!context) throw new Error('Project context not found');

    const contributions: Array<{ agent: AgentType; contribution: string }> = [];

    // Phase 1: Orchestrator analyzes request and delegates
    const orchestratorPrompt = `You are the lead AI Orchestrator coordinating 5 specialized agents.

## Your Team:
1. UI/UX Agent - Frontend & Design
2. Backend Agent - Server & APIs  
3. Database Agent - Data & Schema
4. QA Agent - Testing & Quality
5. DevOps Agent - Infrastructure

## User Request:
${userRequest}

## Project Context:
- Title: ${context.projectTitle}
- Description: ${context.projectDescription}
- Type: ${context.projectType}

## Your Task:
1. Analyze what the user wants
2. Determine which agents need to be involved
3. Create a brief plan with tasks for each relevant agent
4. Provide your analysis in JSON format:

{
  "analysis": "Brief analysis of request",
  "requiredAgents": ["ui_ux", "backend", etc],
  "tasks": {
    "ui_ux": "Task for UI/UX agent or null",
    "backend": "Task for Backend agent or null",
    "database": "Task for Database agent or null",
    "qa": "Task for QA agent or null",
    "devops": "Task for DevOps agent or null"
  },
  "executionOrder": ["database", "backend", "ui_ux", etc],
  "response": "Your response to the user explaining what you're doing"
}`;

    const orchestratorMessages: AIMessage[] = [
      { role: 'system', content: 'You are the lead AI Orchestrator. Always respond with valid JSON.' },
      { role: 'user', content: orchestratorPrompt }
    ];

    let orchestratorPlan: any;
    try {
      const response = await aiProvider.chat(orchestratorMessages, {
        ...this.aiConfig
      });

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        orchestratorPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid orchestrator response');
      }
    } catch (error) {
      // Fallback plan
      orchestratorPlan = {
        analysis: 'Processing your request...',
        requiredAgents: ['ui_ux', 'backend', 'database'],
        tasks: {
          ui_ux: userRequest,
          backend: userRequest,
          database: userRequest
        },
        executionOrder: ['database', 'backend', 'ui_ux'],
        response: 'I\'m analyzing your request and coordinating with the team.'
      };
    }

    // Phase 2: Execute agents in order
    for (const agentType of (orchestratorPlan.executionOrder || ['database', 'backend', 'ui_ux'])) {
      const task = orchestratorPlan.tasks?.[agentType];
      if (!task) continue;

      try {
        // Notify other agents
        this.agentMessage(projectId, agentType as AgentType, 'all', `Starting work on: ${task.substring(0, 100)}...`);

        const result = await this.agentThink(projectId, agentType as AgentType, task);
        
        contributions.push({
          agent: agentType as AgentType,
          contribution: result
        });

        // Update state to completed
        context.agentStates[agentType as AgentType] = {
          status: 'completed',
          currentTask: task,
          progress: 100,
          lastOutput: result.substring(0, 200)
        };
        this.broadcastAgentStatus(projectId, agentType as AgentType, context.agentStates[agentType as AgentType]);

        // Share results with other agents
        this.agentMessage(projectId, agentType as AgentType, 'all', `Completed: ${result.substring(0, 150)}...`);

      } catch (error: any) {
        this.reportIssue(projectId, agentType as AgentType, error.message);
      }
    }

    // Phase 3: Synthesize final response
    const synthesisPrompt = `Based on the team's work, provide a comprehensive response to the user.

## Original Request:
${userRequest}

## Team Contributions:
${contributions.map(c => `### ${AGENT_PERSONAS[c.agent].name}:\n${c.contribution}`).join('\n\n')}

Synthesize these contributions into a coherent, helpful response. Include any code that was generated.`;

    const finalResponse = await aiProvider.chat([
      { role: 'system', content: 'You are a helpful AI assistant synthesizing team outputs.' },
      { role: 'user', content: synthesisPrompt }
    ], this.aiConfig);

    return {
      orchestratorResponse: finalResponse.content,
      agentContributions: contributions
    };
  }

  // Quick single-agent response (for chat)
  async quickResponse(projectId: string, userMessage: string): Promise<{
    response: string;
    suggestedAgent?: AgentType;
    model: string;
    provider: string;
  }> {
    const context = this.contexts.get(projectId) || this.initializeContext(projectId, {
      title: 'Chat Project',
      description: 'User conversation',
      projectType: 'web'
    });

    // Determine best agent for this message
    const agentSelector = await this.selectBestAgent(userMessage);
    
    const messages = this.buildAgentPrompt(agentSelector, context, userMessage);
    const response = await aiProvider.chat(messages, {
      ...this.aiConfig
    });

    return {
      response: response.content,
      suggestedAgent: agentSelector,
      model: response.model,
      provider: response.provider
    };
  }

  // Select best agent for a message
  private async selectBestAgent(message: string): Promise<AgentType> {
    const lowerMessage = message.toLowerCase();
    
    // Simple keyword matching
    if (lowerMessage.includes('ui') || lowerMessage.includes('design') || 
        lowerMessage.includes('frontend') || lowerMessage.includes('react') ||
        lowerMessage.includes('css') || lowerMessage.includes('واجه')) {
      return 'ui_ux';
    }
    if (lowerMessage.includes('api') || lowerMessage.includes('server') ||
        lowerMessage.includes('backend') || lowerMessage.includes('express') ||
        lowerMessage.includes('خادم')) {
      return 'backend';
    }
    if (lowerMessage.includes('database') || lowerMessage.includes('sql') ||
        lowerMessage.includes('schema') || lowerMessage.includes('قاعدة')) {
      return 'database';
    }
    if (lowerMessage.includes('test') || lowerMessage.includes('quality') ||
        lowerMessage.includes('bug') || lowerMessage.includes('اختبار')) {
      return 'qa';
    }
    if (lowerMessage.includes('deploy') || lowerMessage.includes('docker') ||
        lowerMessage.includes('ci/cd') || lowerMessage.includes('نشر')) {
      return 'devops';
    }

    // Default to backend for general programming questions
    return 'backend';
  }

  private broadcastAgentStatus(projectId: string, agent: AgentType, state: any): void {
    wsService.sendAgentStatus(projectId, {
      agentType: agent,
      status: state.status,
      progress: state.progress,
      message: state.currentTask || '',
      result: state.lastOutput
    });
  }

  // Get agent personas for frontend
  getAgentPersonas(): typeof AGENT_PERSONAS {
    return AGENT_PERSONAS;
  }

  // Configure AI provider
  setProviderConfig(config: Partial<AIProviderConfig>): void {
    this.aiConfig = { ...this.aiConfig, ...config };
  }

  // Get current AI provider configuration
  getCurrentConfig(): { type: string; model: string } {
    return {
      type: this.aiConfig.type || 'gemini',
      model: this.aiConfig.model || 'gemini-2.5-flash'
    };
  }
}

export const agentOrchestrator = new AgentOrchestrator();
