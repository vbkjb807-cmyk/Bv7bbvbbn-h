import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Eye, EyeOff, User, Mail, Lock, ArrowRight, Code, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

const programmerRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  hourlyRate: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof programmerRegisterSchema>;

const SKILL_OPTIONS = [
  "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js",
  "Python", "Django", "FastAPI", "Java", "Spring Boot", "C#", ".NET",
  "Go", "Rust", "PHP", "Laravel", "Ruby", "Rails",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "REST API",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD",
  "HTML/CSS", "Tailwind CSS", "SASS", "UI/UX Design",
];

export default function ProgrammerRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { registerProgrammer, registerProgrammerPending } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(programmerRegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      bio: "",
      hourlyRate: "25.00",
    },
  });

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill) && selectedSkills.length < 10) {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  };

  const filteredSkills = SKILL_OPTIONS.filter(
    (skill) =>
      skill.toLowerCase().includes(skillInput.toLowerCase()) &&
      !selectedSkills.includes(skill)
  );

  const onSubmit = async (data: FormValues) => {
    if (selectedSkills.length === 0) {
      toast({
        title: "Skills required",
        description: "Please add at least one skill",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await registerProgrammer({
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        skills: selectedSkills,
        bio: data.bio,
        hourlyRate: data.hourlyRate,
      });
      
      if (result.requiresEmailVerification) {
        toast({
          title: "Verification email sent!",
          description: "Please check your email to verify your account. Your account is also pending admin approval.",
        });
        // Navigate to verification page (only email, no password for security)
        navigate(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        toast({
          title: "Registration successful!",
          description: "Your account is pending admin approval. We'll notify you when approved.",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 p-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">CodeMaster AI</span>
        </button>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-10">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 w-fit">
                <Code className="h-8 w-8 text-orange-500" />
              </div>
              <CardTitle className="text-2xl">انضم كـ Human Agent</CardTitle>
              <CardTitle className="text-lg text-muted-foreground mt-1">Join as Human Agent</CardTitle>
              <CardDescription className="mt-2">
                ساعد العملاء عندما يفشل الذكاء الاصطناعي واكسب المال من خبرتك
                <br />
                <span className="text-xs">Help clients when AI fails and earn money from your expertise</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John"
                              data-testid="input-programmer-firstname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Doe"
                              data-testid="input-programmer-lastname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="johndoe"
                              className="pl-10"
                              data-testid="input-programmer-username"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="email@example.com"
                              className="pl-10"
                              data-testid="input-programmer-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                className="pl-10 pr-10"
                                data-testid="input-programmer-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirm password"
                                className="pl-10"
                                data-testid="input-programmer-confirm-password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <FormLabel>Skills (select up to 10)</FormLabel>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Search skills..."
                      data-testid="input-programmer-skills"
                    />
                    {skillInput && filteredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {filteredSkills.slice(0, 8).map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="cursor-pointer hover-elevate"
                            onClick={() => addSkill(skill)}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {!skillInput && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SKILL_OPTIONS.slice(0, 8)
                          .filter((s) => !selectedSkills.includes(s))
                          .map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="cursor-pointer hover-elevate"
                              onClick={() => addSkill(skill)}
                            >
                              {skill}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell us about your experience and expertise..."
                            className="min-h-[100px]"
                            data-testid="input-programmer-bio"
                          />
                        </FormControl>
                        <FormDescription>
                          Describe your experience, specialties, and what makes you a great developer.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="5"
                              placeholder="25.00"
                              className="pl-10"
                              data-testid="input-programmer-hourly-rate"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your preferred hourly rate for development work.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerProgrammerPending}
                    data-testid="button-programmer-register-submit"
                  >
                    {registerProgrammerPending ? "Creating account..." : "Register as Programmer"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => navigate("/auth")}
                    className="text-primary hover:underline"
                    data-testid="link-login"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
