import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Bot, 
  Zap, 
  Shield, 
  Code, 
  Users, 
  Wallet,
  ArrowRight,
  CheckCircle,
  Palette,
  Server,
  Database,
  TestTube,
  Cloud,
  Sparkles,
  Terminal,
  Layers,
  Globe,
  Lock,
  Cpu,
  GitBranch,
  Play,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  {
    icon: Bot,
    title: "5 AI Agents Working Together",
    description: "Specialized AI agents for UI/UX, Backend, Database, QA, and DevOps collaborate in real-time on your project.",
  },
  {
    icon: Users,
    title: "Human Expert Backup",
    description: "Professional developers ready to step in when AI needs human expertise or code review.",
  },
  {
    icon: Terminal,
    title: "Built-in IDE",
    description: "Full-featured code editor with syntax highlighting, integrated terminal, and real-time live preview.",
  },
  {
    icon: Zap,
    title: "Lightning Fast Deployment",
    description: "Deploy your project with one click. AI agents work 24/7 to deliver production-ready code.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "End-to-end encryption, secure authentication, and protected code access.",
  },
  {
    icon: GitBranch,
    title: "Version Control",
    description: "Built-in version control and collaboration tools for seamless team development.",
  },
];

const agents = [
  { name: "UI/UX Agent", icon: Palette, color: "bg-gradient-to-br from-pink-500/20 to-rose-500/20 text-pink-500", description: "Designs beautiful interfaces" },
  { name: "Backend Agent", icon: Server, color: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-500", description: "Builds robust APIs" },
  { name: "Database Agent", icon: Database, color: "bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-500", description: "Optimizes data layer" },
  { name: "QA Agent", icon: TestTube, color: "bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-500", description: "Ensures quality" },
  { name: "DevOps Agent", icon: Cloud, color: "bg-gradient-to-br from-purple-500/20 to-violet-500/20 text-purple-500", description: "Handles deployment" },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$10",
    description: "Perfect for small projects",
    features: ["All 5 AI Agents", "Basic support", "5 projects/month", "Community access", "Email support"],
  },
  {
    name: "Pro",
    price: "$50",
    description: "Best for growing teams",
    features: ["All 5 AI Agents", "Priority support", "Unlimited projects", "Human developer access", "Private chat", "Custom deployments"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: ["Dedicated AI instances", "24/7 premium support", "Custom integrations", "SLA guarantee", "On-premise option", "Dedicated account manager"],
  },
];

const stats = [
  { value: "10K+", label: "Projects Built" },
  { value: "5", label: "AI Agents" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight">AgentForge AI</span>
              <span className="text-[10px] text-muted-foreground -mt-1">5 Agents + Human Expert</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Agents</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="ghost"
              onClick={() => navigate("/auth")}
              data-testid="button-signin"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-primary/90 shadow-md"
              data-testid="button-login"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto text-center max-w-5xl relative">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            The Future of AI-Powered Development
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            Build Software with
            <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent"> 5 AI Agents</span>
            <br />& Expert Developers
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Create complete software projects effortlessly. Our specialized AI agents work in parallel 
            while human experts ensure perfection. It's like having an entire dev team at your fingertips.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-primary/90 shadow-lg px-8 h-12 text-base"
              data-testid="button-start-project"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Building Now
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8" data-testid="button-learn-more">
              <Monitor className="h-5 w-5 mr-2" />
              Watch Demo
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="agents" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">AI Team</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Your AI Development Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Five specialized AI agents work together in parallel, each mastering their domain to deliver exceptional results.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {agents.map((agent, index) => (
              <Card key={agent.name} className="text-center p-6 hover-elevate transition-all duration-300 group">
                <div className={`w-16 h-16 mx-auto rounded-2xl ${agent.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <agent.icon className="h-8 w-8" />
                </div>
                <p className="font-semibold mb-1">{agent.name}</p>
                <p className="text-xs text-muted-foreground">{agent.description}</p>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Card className="inline-flex items-center gap-3 p-4 border-dashed">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold">+ Human Expert Backup</p>
                <p className="text-xs text-muted-foreground">Professional developers ready when you need them</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose AgentForge AI?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The perfect blend of artificial intelligence and human expertise for your software projects.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={feature.title} className="p-6 hover-elevate transition-all duration-300">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Pay only for what you use.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`p-6 relative transition-all duration-300 hover-elevate ${plan.popular ? "border-primary border-2 shadow-lg shadow-primary/10" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-blue-500 border-0">
                    Most Popular
                  </Badge>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-xl mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-2">{plan.price}<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.popular ? "bg-gradient-to-r from-primary to-blue-500 shadow-md" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => navigate("/auth")}
                  data-testid={`button-choose-${plan.name.toLowerCase()}`}
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
        <div className="container mx-auto text-center max-w-3xl relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Build Something Amazing?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of creators who are building their dreams with AgentForge AI.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-blue-500 shadow-lg h-12 px-8"
              data-testid="button-cta-start"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Start Building Now
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth/programmer")}
              className="h-12 px-8"
              data-testid="button-join-as-programmer"
            >
              <Users className="h-5 w-5 mr-2" />
              Join as Expert Developer
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t bg-muted/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-lg">AgentForge AI</span>
                <p className="text-xs text-muted-foreground">5 AI Agents + Human Expert</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#agents" className="hover:text-foreground transition-colors">AI Agents</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 AgentForge AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
