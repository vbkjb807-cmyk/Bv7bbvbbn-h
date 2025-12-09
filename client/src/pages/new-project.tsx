import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeft, 
  Loader2,
  Bot,
  FileCode,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const projectFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().min(10, "Please provide more details about your project"),
  requirements: z.string().optional(),
  budget: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Budget must be a valid positive number",
  }),
  projectType: z.string(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const projectTypes = [
  { value: "web_app", label: "Web Application" },
  { value: "mobile_app", label: "Mobile Application" },
  { value: "api", label: "API / Backend" },
  { value: "landing", label: "Landing Page" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "dashboard", label: "Dashboard / Admin Panel" },
  { value: "other", label: "Other" },
];

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      budget: "100",
      projectType: "web_app",
    },
  });

  const createProject = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const res = await apiRequest("POST", "/api/projects", {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        budget: data.budget,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Created!",
        description: "AI Agents are now working on your project.",
      });
      setLocation(`/projects/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    createProject.mutate(data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => setLocation("/projects")}
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground mt-2">
          Describe your project and let our AI agents build it for you
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Project Details
          </CardTitle>
          <CardDescription>
            Provide as much detail as possible for better results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="My Awesome App" 
                        {...field} 
                        data-testid="input-project-title"
                      />
                    </FormControl>
                    <FormDescription>
                      A short, descriptive name for your project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project-type">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what you want to build. Include features, functionality, and any specific requirements..."
                        className="min-h-[150px]"
                        {...field} 
                        data-testid="input-project-description"
                      />
                    </FormControl>
                    <FormDescription>
                      The more detail you provide, the better the results
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technical Requirements (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any specific technologies, APIs, or integrations you need..."
                        className="min-h-[100px]"
                        {...field} 
                        data-testid="input-project-requirements"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (USD)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-7"
                          {...field} 
                          data-testid="input-project-budget"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Set a budget limit. You'll only be charged for actual usage.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-4 rounded-lg bg-muted flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">AI-Powered Development</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Once you submit, our 5 AI agents will start working on your project simultaneously. 
                    You can track progress in real-time and request a human developer if needed.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/projects")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createProject.isPending}
                  data-testid="button-create-project"
                >
                  {createProject.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileCode className="h-4 w-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
