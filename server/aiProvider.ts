// Multi-Model AI Provider Service
// Supports: Ollama (local), OpenAI-compatible APIs, Gemini
// Reference: javascript_gemini integration

export type AIProviderType = 'ollama' | 'openai' | 'gemini' | 'lmstudio';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProviderConfig {
  type: AIProviderType;
  baseUrl?: string;
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: AIProviderType;
  tokensUsed?: number;
  error?: string;
}

// Recommended models for each agent type
export const RECOMMENDED_MODELS = {
  ui_ux: {
    ollama: 'qwen2.5-coder:7b',
    description: 'Best for UI/UX code generation'
  },
  backend: {
    ollama: 'deepseek-coder:6.7b',
    description: 'Strong for backend logic and APIs'
  },
  database: {
    ollama: 'qwen2.5-coder:7b',
    description: 'Excellent for SQL (82% Spider benchmark)'
  },
  qa: {
    ollama: 'codellama:7b',
    description: 'Good for test generation'
  },
  devops: {
    ollama: 'mistral:7b',
    description: 'Good for infrastructure and configs'
  },
  orchestrator: {
    ollama: 'qwen2.5-coder:7b',
    description: 'Coordinates all agents'
  }
};

class AIProvider {
  private defaultConfig: AIProviderConfig = {
    type: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 8192
  };

  private geminiApiKey: string | null = null;
  private openaiApiKey: string | null = null;

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || null;
    this.openaiApiKey = process.env.OPENAI_API_KEY || null;
  }

  async chat(messages: AIMessage[], config?: Partial<AIProviderConfig>): Promise<AIResponse> {
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      switch (finalConfig.type) {
        case 'ollama':
          return await this.chatOllama(messages, finalConfig);
        case 'lmstudio':
          return await this.chatLMStudio(messages, finalConfig);
        case 'openai':
          return await this.chatOpenAI(messages, finalConfig);
        case 'gemini':
          return await this.chatGemini(messages, finalConfig);
        default:
          throw new Error(`Unknown provider: ${finalConfig.type}`);
      }
    } catch (error: any) {
      console.error(`AI Provider error (${finalConfig.type}):`, error.message);
      
      // Fallback to next available provider
      const fallbackOrder: AIProviderType[] = ['ollama', 'gemini', 'openai'];
      for (const fallback of fallbackOrder) {
        if (fallback !== finalConfig.type && this.isProviderAvailable(fallback)) {
          console.log(`Falling back to ${fallback}...`);
          try {
            return await this.chat(messages, { ...finalConfig, type: fallback });
          } catch (e) {
            continue;
          }
        }
      }
      
      return {
        content: `Error: Could not connect to any AI provider. Please ensure Ollama is running locally or configure API keys.`,
        model: finalConfig.model,
        provider: finalConfig.type,
        error: error.message
      };
    }
  }

  private isProviderAvailable(type: AIProviderType): boolean {
    switch (type) {
      case 'gemini':
        return !!this.geminiApiKey;
      case 'openai':
        return !!this.openaiApiKey;
      case 'ollama':
      case 'lmstudio':
        return true; // Always try local providers
      default:
        return false;
    }
  }

  private async chatOllama(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse> {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || '',
      model: config.model,
      provider: 'ollama',
      tokensUsed: data.eval_count
    };
  }

  private async chatLMStudio(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse> {
    // LM Studio uses OpenAI-compatible API
    const baseUrl = config.baseUrl || 'http://localhost:1234';
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`LM Studio error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: config.model,
      provider: 'lmstudio',
      tokensUsed: data.usage?.total_tokens
    };
  }

  private async chatOpenAI(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        // the newest OpenAI model is "gpt-5" which was released August 7, 2025
        model: config.model || 'gpt-5',
        messages: messages,
        max_completion_tokens: config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: config.model || 'gpt-5',
      provider: 'openai',
      tokensUsed: data.usage?.total_tokens
    };
  }

  private async chatGemini(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Convert messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const systemInstruction = messages.find(m => m.role === 'system')?.content;

    const response = await fetch(
      // the newest Gemini model series is "gemini-2.5-flash"
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-2.5-flash'}:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini error: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model: config.model || 'gemini-2.5-flash',
      provider: 'gemini',
      tokensUsed: data.usageMetadata?.totalTokenCount
    };
  }

  async listOllamaModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.defaultConfig.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  async isOllamaAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.defaultConfig.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getProviderStatus(): { ollama: boolean; gemini: boolean; openai: boolean } {
    return {
      ollama: false, // Will be checked async
      gemini: !!this.geminiApiKey,
      openai: !!this.openaiApiKey
    };
  }
}

export const aiProvider = new AIProvider();
