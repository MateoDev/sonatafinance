import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  LineChart, 
  Receipt,
  CreditCard,
  BarChart3,
  LogOut,
  Target,
  Settings,
  FileText,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import Logo from "@/components/brand/Logo";

export default function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    // Special handling for dashboard to ensure it's properly highlighted
    if (path === "/dashboard") {
      return location === "/dashboard";
    }
    return location === path;
  };

  // Reusable sidebar menu item component - Apple style
  const SidebarItem = ({ 
    href, 
    icon: Icon, 
    label, 
    isActive 
  }: { 
    href: string; 
    icon: React.ElementType; 
    label: string; 
    isActive: boolean 
  }) => (
    <li className="mb-3">
      <Link href={href}>
        <div className={cn(
          "flex items-center px-5 py-3 rounded-xl",
          "transition-all duration-200 ease-out cursor-pointer",
          isActive 
            ? "bg-primary/10 font-medium" 
            : "text-neutral-700 hover:bg-neutral-100"
        )}>
          <Icon className={cn(
            "h-5 w-5 mr-3", 
            isActive ? "text-primary" : "text-neutral-500"
          )} />
          <span className={cn(
            "text-sm",
            isActive && "text-primary"
          )}>{label}</span>
        </div>
      </Link>
    </li>
  );

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logout();
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  return (
    <div className="sidebar hidden md:flex md:flex-col md:w-72 bg-[#f5f5f7] z-10 border-r border-neutral-200 h-screen sticky top-0">
      <div className="px-8 py-8 border-b border-neutral-200">
        <h2 className="text-2xl font-semibold flex items-center text-black">
          <Logo size="md" className="mr-3" />
        </h2>
      </div>
      
      <nav className="px-5 py-6 flex-1 overflow-y-auto">
        <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4 px-3">
          Finance
        </div>
        <ul>
          <SidebarItem 
            href="/dashboard" 
            icon={LayoutDashboard} 
            label="Dashboard" 
            isActive={isActive("/dashboard")} 
          />
          
          <SidebarItem 
            href="/budget" 
            icon={Receipt} 
            label="Budget" 
            isActive={isActive("/budget")} 
          />
          
          <SidebarItem 
            href="/investments" 
            icon={LineChart} 
            label="Investments" 
            isActive={isActive("/investments")} 
          />
          
          <SidebarItem 
            href="/liabilities" 
            icon={CreditCard} 
            label="Liabilities" 
            isActive={isActive("/liabilities")} 
          />
        </ul>
        
        <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4 mt-8 px-3">
          Planning
        </div>
        <ul>
          <SidebarItem 
            href="/goals" 
            icon={Target} 
            label="Financial Goals" 
            isActive={isActive("/goals")} 
          />
          
          <SidebarItem 
            href="/notes" 
            icon={FileText} 
            label="Notes" 
            isActive={isActive("/notes")} 
          />
          
          <SidebarItem 
            href="/chat" 
            icon={MessageSquare} 
            label="Sidekick" 
            isActive={isActive("/chat")} 
          />
        </ul>
      </nav>
      
      <div className="mt-auto p-6 border-t border-neutral-200">
        <Link href="/settings">
          <div className={cn(
            "flex items-center px-5 py-3 rounded-xl mb-4",
            "transition-all duration-200 ease-out cursor-pointer",
            isActive("/settings") 
              ? "bg-primary/10 font-medium" 
              : "text-neutral-700 hover:bg-neutral-200"
          )}>
            <Settings className={cn(
              "h-5 w-5 mr-3",
              isActive("/settings") ? "text-primary" : "text-neutral-500"
            )} />
            <span className={cn(
              "text-sm",
              isActive("/settings") && "text-primary"
            )}>Settings</span>
          </div>
        </Link>
        
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center w-full px-5 py-3 rounded-xl",
            "text-red-600",
            "transition-all duration-200 ease-out",
            "hover:bg-red-100"
          )}
        >
          <LogOut className="h-5 w-5 mr-3 text-red-500" />
          <span className="text-sm">Log Out</span>
        </button>
      </div>
    </div>
  );
}
