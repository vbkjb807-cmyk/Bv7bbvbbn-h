import { Link, useLocation } from "wouter";
import { 
  Home, 
  FolderOpen, 
  Plus, 
  Wallet, 
  Users, 
  Settings,
  LogOut,
  Bot,
  Sparkles,
  Terminal,
  Zap
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BalanceDisplay } from "./BalanceDisplay";

const clientMenuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "My Projects", url: "/projects", icon: FolderOpen },
  { title: "New Project", url: "/projects/new", icon: Plus },
  { title: "Balance", url: "/balance", icon: Wallet },
];

const programmerMenuItems = [
  { title: "Dashboard", url: "/programmer", icon: Home },
  { title: "Available Tasks", url: "/programmer/tasks", icon: FolderOpen },
  { title: "My Earnings", url: "/programmer/earnings", icon: Wallet },
];

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { user, logout, logoutPending } = useAuth();
  
  const isProgrammer = user?.role === "programmer";
  const menuItems = isProgrammer ? programmerMenuItems : clientMenuItems;

  const getInitials = () => {
    const first = user?.firstName?.charAt(0) || "";
    const last = user?.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-sidebar" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">AgentForge AI</h1>
            <p className="text-[10px] text-muted-foreground">5 Agents + Human Expert</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`nav-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isProgrammer && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>Your Balance</SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <BalanceDisplay balance={user?.balance || "0"} compact />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="ghost" size="sm" className="flex-1" asChild>
            <Link href="/settings" data-testid="nav-link-settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleLogout}
            disabled={logoutPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutPending ? "..." : "Logout"}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
