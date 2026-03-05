import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  LineChart, 
  Receipt,
  CreditCard,
  Target,
  Settings,
  MessageSquare,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  // Modern touchable tab item for mobile navigation - Apple style
  const NavItem = ({ 
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
    <Link href={href}>
      <div className={cn(
        "w-full flex flex-col items-center justify-center py-2 px-2",
        "transition-all duration-200 ease-out cursor-pointer",
        isActive 
          ? "text-primary" 
          : "text-neutral-400 hover:text-neutral-600"
      )}>
        <Icon className={cn(
          "h-6 w-6 mb-1", 
          isActive ? "text-primary" : "text-neutral-400"
        )} />
        <span className={cn(
          "text-xs",
          isActive && "font-medium"
        )}>{label}</span>
      </div>
    </Link>
  );

  return (
    <div className="mobile-nav fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-neutral-200 z-10 md:hidden">
      <div className="flex justify-around items-center py-1">
        <NavItem 
          href="/" 
          icon={LayoutDashboard} 
          label="Dashboard" 
          isActive={isActive("/")} 
        />
        
        <NavItem 
          href="/budget" 
          icon={Receipt} 
          label="Budget" 
          isActive={isActive("/budget")} 
        />
        
        <NavItem 
          href="/investments" 
          icon={LineChart} 
          label="Invest" 
          isActive={isActive("/investments")} 
        />
        
        <NavItem 
          href="/liabilities" 
          icon={CreditCard} 
          label="Debt" 
          isActive={isActive("/liabilities")} 
        />
        
        <NavItem 
          href="/settings" 
          icon={Settings} 
          label="Settings" 
          isActive={isActive("/settings")} 
        />
      </div>
    </div>
  );
}
