import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Bell, 
  Menu,
  User, 
  Search, 
  ChevronDown,
  LogOut,
  Settings,
  BarChart3,
  LayoutDashboard,
  Receipt,
  LineChart,
  CreditCard,
  Target
} from "lucide-react";
import Logo from "@/components/brand/Logo";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import SearchBar from "./SearchBar";
import { MarketTicker } from "@/components/MarketTicker";

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps = {}) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  // Use authenticated user
  const effectiveUser = user;
  
  // Get page title based on current route or prop
  const getPageTitle = () => {
    // If title prop is provided, use it
    if (title) return title;

    // Otherwise derive from route
    switch (location) {
      case "/": return "Dashboard";
      case "/investments": return "Investments";
      case "/chat": return "AI Financial Advisor";
      case "/history": return "Transaction History";
      case "/reports": return "Financial Reports";
      case "/settings": return "Settings";
      default: return "Personal Finance";
    }
  };

  const handleLogout = () => {
    logout();
    setTimeout(() => { window.location.href = '/'; }, 500);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-20 px-4 sm:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Left section - Menu button and Logo */}
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-[#f5f5f7]">
              <div className="flex flex-col h-full">
                <div className="px-6 py-8 border-b border-neutral-200">
                  <h2 className="text-2xl font-semibold text-black flex items-center">
                    <Logo size="md" className="mr-3" />
                  </h2>
                </div>
                
                <nav className="px-5 py-6 flex-1 overflow-y-auto">
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4 px-3">
                    Finance
                  </div>
                  <ul className="space-y-2 mb-8">
                    <li>
                      <a 
                        href="/" 
                        className={`flex items-center py-3 px-5 rounded-xl text-sm ${location === "/" ? "bg-primary/10 text-primary font-medium" : "text-neutral-700 hover:bg-neutral-100"}`}
                      >
                        <LayoutDashboard className="h-5 w-5 mr-3" />
                        Dashboard
                      </a>
                    </li>
                    <li>
                      <a 
                        href="/budget" 
                        className={`flex items-center py-3 px-5 rounded-xl text-sm ${location === "/budget" ? "bg-primary/10 text-primary font-medium" : "text-neutral-700 hover:bg-neutral-100"}`}
                      >
                        <Receipt className="h-5 w-5 mr-3" />
                        Budget
                      </a>
                    </li>
                    <li>
                      <a 
                        href="/investments" 
                        className={`flex items-center py-3 px-5 rounded-xl text-sm ${location === "/investments" ? "bg-primary/10 text-primary font-medium" : "text-neutral-700 hover:bg-neutral-100"}`}
                      >
                        <LineChart className="h-5 w-5 mr-3" />
                        Investments
                      </a>
                    </li>
                    <li>
                      <a 
                        href="/liabilities" 
                        className={`flex items-center py-3 px-5 rounded-xl text-sm ${location === "/liabilities" ? "bg-primary/10 text-primary font-medium" : "text-neutral-700 hover:bg-neutral-100"}`}
                      >
                        <CreditCard className="h-5 w-5 mr-3" />
                        Liabilities
                      </a>
                    </li>
                  </ul>
                  
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4 px-3">
                    Planning
                  </div>
                  <ul className="space-y-2">
                    <li>
                      <a 
                        href="/goals" 
                        className={`flex items-center py-3 px-5 rounded-xl text-sm ${location === "/goals" ? "bg-primary/10 text-primary font-medium" : "text-neutral-700 hover:bg-neutral-100"}`}
                      >
                        <Target className="h-5 w-5 mr-3" />
                        Financial Goals
                      </a>
                    </li>
                    <li>
                      <a 
                        href="/chat" 
                        className={`flex items-center py-3 px-5 rounded-xl text-sm ${location === "/chat" ? "bg-primary/10 text-primary font-medium" : "text-neutral-700 hover:bg-neutral-100"}`}
                      >
                        <Settings className="h-5 w-5 mr-3" />
                        Financial Assistant
                      </a>
                    </li>
                  </ul>
                </nav>
                
                <div className="mt-auto p-6 border-t border-neutral-200">
                  <a 
                    href="/settings"
                    className="flex items-center w-full px-5 py-3 rounded-xl text-neutral-700 hover:bg-neutral-200 mb-4"
                  >
                    <Settings className="h-5 w-5 mr-3 text-neutral-500" />
                    <span className="text-sm">Settings</span>
                  </a>
                  
                  <button
                    onClick={handleLogout}
                    
                    className="flex items-center w-full px-5 py-3 rounded-xl text-red-600 hover:bg-red-100"
                  >
                    <LogOut className="h-5 w-5 mr-3 text-red-500" />
                    <span className="text-sm">{"Log Out"}</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Center - market ticker */}
        <div className="hidden md:flex items-center justify-center overflow-hidden flex-1 mx-auto">
          <MarketTicker />
        </div>
        
        {/* Right section - user profile and actions */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Mobile search button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Desktop search */}
          <div className="hidden md:block mr-1">
            <SearchBar />
          </div>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  {effectiveUser?.profileImage ? (
                    <img 
                      src={effectiveUser.profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                      {effectiveUser ? effectiveUser.name?.charAt(0) || effectiveUser.username?.charAt(0) || 'U' : 'U'}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:inline-block">
                  {effectiveUser ? effectiveUser.name || effectiveUser.username : 'User'}
                </span>
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" asChild>
                <a href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <a href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
                
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{"Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile search bar (conditionally shown) */}
      {isMobileSearchOpen && (
        <div className="py-2 pb-3 md:hidden">
          <SearchBar isMobile={true} />
        </div>
      )}
    </header>
  );
}