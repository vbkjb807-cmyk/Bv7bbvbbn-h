import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  Settings, 
  Server, 
  Cpu, 
  Zap, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  ExternalLink,
  Download,
  Palette,
  Database,
  TestTube,
  Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const agentIcons: Record<string, any> = {
  ui_ux: Palette,
  backend: Server,
  database: Database,
  qa: TestTube,
  devops: Cloud,
  orchestrator: Cpu
};

export default function AISettingsPage() {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [selectedModel, setSelectedModel] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin (from auth context)
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken") || ""}` }
        });
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.user?.role === "admin");
        }
      } catch {}
    };
    checkAdminStatus();
  }, []);

  const { data: aiStatus, isLoading, refetch } = useQuery({
    queryKey: ["/api/ai/status"],
  });

  // Sync selected provider with backend status - always reflect latest backend config
  useEffect(() => {
    if (aiStatus?.activeProvider) {
      setSelectedProvider(aiStatus.activeProvider);
    }
    if (aiStatus?.activeModel) {
      setSelectedModel(aiStatus.activeModel);
    }
  }, [aiStatus?.activeProvider, aiStatus?.activeModel]);

  // Only show active provider from backend data, not defaults
  const activeProvider = aiStatus?.activeProvider;
  const activeModel = aiStatus?.activeModel;

  const configureAI = useMutation({
    mutationFn: async (config: { provider: string; baseUrl?: string; model?: string }) => {
      await apiRequest("POST", "/api/ai/configure", config);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "AI settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update AI configuration",
        variant: "destructive",
      });
    },
  });

  const handleSaveConfig = () => {
    if (!selectedProvider) {
      toast({
        title: "Error",
        description: "Please select a provider",
        variant: "destructive",
      });
      return;
    }
    configureAI.mutate({
      provider: selectedProvider,
      baseUrl: selectedProvider === "ollama" ? ollamaUrl : undefined,
      model: selectedModel || undefined,
    });
  };

  const ollamaModels = aiStatus?.providers?.ollama?.models || [];
  const recommendedModels = aiStatus?.recommendedModels || {};

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            AI Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure AI models and providers for your agents
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className={activeProvider === "ollama" ? "border-primary/50" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4" />
              Ollama (Local)
              {activeProvider === "ollama" && (
                <Badge variant="default" className="ml-auto text-xs">Active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {aiStatus?.providers?.ollama?.available ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not Running</span>
                </>
              )}
            </div>
            {ollamaModels.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {ollamaModels.length} models available
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={activeProvider === "gemini" ? "border-primary/50" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Gemini API
              {activeProvider === "gemini" && (
                <Badge variant="default" className="ml-auto text-xs">Active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {aiStatus?.providers?.gemini?.available ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not Configured</span>
                </>
              )}
            </div>
            {activeProvider === "gemini" && (
              <p className="text-xs text-muted-foreground mt-2">
                Model: {activeModel}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={activeProvider === "openai" ? "border-primary/50" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              OpenAI API
              {activeProvider === "openai" && (
                <Badge variant="default" className="ml-auto text-xs">Active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {aiStatus?.providers?.openai?.available ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-600">Configured</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not Configured</span>
                </>
              )}
            </div>
            {activeProvider === "openai" && (
              <p className="text-xs text-muted-foreground mt-2">
                Model: {activeModel}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
          <CardDescription>
            Select which AI provider to use for the agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={isLoading}>
                <SelectTrigger data-testid="select-ai-provider">
                  <SelectValue placeholder={isLoading ? "Loading..." : "Select provider"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ollama">Ollama (Local)</SelectItem>
                  <SelectItem value="lmstudio">LM Studio (Local)</SelectItem>
                  <SelectItem value="gemini">Gemini API</SelectItem>
                  <SelectItem value="openai">OpenAI API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(selectedProvider === "ollama" || selectedProvider === "lmstudio") && (
              <div className="space-y-2">
                <Label>Server URL</Label>
                <Input
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  data-testid="input-ollama-url"
                />
              </div>
            )}
          </div>

          {selectedProvider === "ollama" && ollamaModels.length > 0 && (
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger data-testid="select-ai-model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {ollamaModels.map((model: string) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleSaveConfig} 
            disabled={configureAI.isPending || !isAdmin || isLoading || !selectedProvider} 
            data-testid="button-save-ai-config"
          >
            {configureAI.isPending ? "Saving..." : isLoading ? "Loading..." : "Save Configuration"}
          </Button>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground">
              Only administrators can change AI configuration
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Agent Configuration</CardTitle>
          <CardDescription>
            {activeProvider && activeModel 
              ? `All agents are powered by ${activeProvider === "gemini" ? "Gemini" : activeProvider === "ollama" ? "Ollama" : activeProvider === "openai" ? "OpenAI" : activeProvider} (${activeModel})`
              : "Loading configuration..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(recommendedModels).map(([agent, info]: [string, any]) => {
              const Icon = agentIcons[agent] || Cpu;
              return (
                <div key={agent} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium capitalize">{agent.replace('_', '/')}</span>
                  </div>
                  <Badge variant="default" className="mb-2">{activeModel || "Loading..."}</Badge>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!aiStatus?.providers?.ollama?.available && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Getting Started with Ollama
            </CardTitle>
            <CardDescription>
              Run AI models locally for free with Ollama
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">1. Install Ollama from the official website:</p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  ollama.com
                </a>
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm">2. Pull recommended models:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs space-y-1">
                <p>ollama pull qwen2.5-coder:7b</p>
                <p>ollama pull deepseek-coder:6.7b</p>
                <p>ollama pull codellama:7b</p>
                <p>ollama pull mistral:7b</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm">3. Start Ollama server:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs">
                <p>ollama serve</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
