import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Calculator,
  TrendingUp,
  CreditCard,
  ArrowLeftRight,
  Repeat,
  Bot,
  Menu,
  X,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, route: "/dashboard" },
  { label: "Budget", icon: Calculator, route: "/budget" },
  { label: "Investments", icon: TrendingUp, route: "/investments" },
  { label: "Liabilities", icon: CreditCard, route: "/liabilities" },
  { label: "Cash In/Out", icon: ArrowLeftRight, route: "/cashflow" },
  { label: "Subscriptions", icon: Repeat, route: "/subscriptions" },
  { label: "Agent", icon: Bot, route: "/agent" },
] as const;

const SIDEBAR_KEY = "sonata-sidebar-collapsed";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === "true"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggleCollapse = useCallback(() => {
    if (isMobile) {
      setMobileOpen(p => !p);
    } else {
      setCollapsed(p => {
        const next = !p;
        try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
        return next;
      });
    }
  }, [isMobile]);

  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleLogout = () => {
    logout();
    setTimeout(() => { window.location.href = "/"; }, 500);
  };

  const sidebarWidth = collapsed && !mobileOpen ? "w-16" : "w-60";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Toggle */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-neutral-800">
        {(!collapsed || mobileOpen) && (
          <span className="text-lg font-bold text-white tracking-tight pl-1">Sonata</span>
        )}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = location === item.route || (item.route !== "/dashboard" && location.startsWith(item.route + "/"));
          const Icon = item.icon;
          return (
            <Link key={item.route} href={item.route}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm font-medium",
                  active
                    ? "bg-neutral-800 text-white border-l-2 border-emerald-500 ml-0 pl-[10px]"
                    : "text-neutral-400 hover:bg-neutral-800/60 hover:text-white"
                )}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-neutral-800 p-3">
        <div className={cn("flex items-center gap-3", collapsed && !mobileOpen && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.name || user?.username || "User"}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-neutral-900 overflow-hidden">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-neutral-950 border-r border-neutral-800 flex-shrink-0 transition-all duration-200",
          isMobile
            ? cn("fixed inset-y-0 left-0 z-50 w-60 transform", mobileOpen ? "translate-x-0" : "-translate-x-full")
            : sidebarWidth
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger (when sidebar hidden) */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-30 p-2 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
