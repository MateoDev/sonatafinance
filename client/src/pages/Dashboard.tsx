import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { WelcomeAnimation } from "@/components/WelcomeAnimation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/hooks/use-auth";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  PiggyBank,
  Plus,
  Receipt,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function fmtCurrency(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v < 0 ? "-" : "") + "$" + (abs / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (v < 0 ? "-" : "") + "$" + abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return (v < 0 ? "-" : "") + "$" + abs.toFixed(2);
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280", "#ec4899"];

function EmptyState({ icon: Icon, title, cta, href }: { icon: any; title: string; cta: string; href: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-8 w-8 text-neutral-600 mb-3" />
      <p className="text-sm text-neutral-500 mb-3">{title}</p>
      <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-700" onClick={() => window.location.href = href}>
        <Plus className="h-3 w-3 mr-1" /> {cta}
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const params = new URLSearchParams(window.location.search);
  const isWelcome = params.get("welcome") === "true";
  const welcomeName = params.get("name") || "there";
  const [showWelcome, setShowWelcome] = useState(isWelcome);

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
    window.history.replaceState({}, "", "/dashboard");
  }, []);

  // Fetch real data
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/portfolio/summary"],
    queryFn: async () => {
      const res = await authFetch("/api/portfolio/summary");
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const { data: investments = [], isLoading: investmentsLoading } = useQuery({
    queryKey: ["/api/investments"],
    queryFn: async () => {
      const res = await authFetch("/api/investments");
      if (!res.ok) throw new Error("Failed to fetch investments");
      return res.json();
    },
  });

  const { data: liabilities = [], isLoading: liabilitiesLoading } = useQuery({
    queryKey: ["/api/liabilities"],
    queryFn: async () => {
      const res = await authFetch("/api/liabilities");
      if (!res.ok) throw new Error("Failed to fetch liabilities");
      return res.json();
    },
  });

  const { data: budgetGrid = {}, isLoading: budgetLoading } = useQuery({
    queryKey: ["/api/budget/grid"],
    queryFn: async () => {
      const res = await authFetch("/api/budget/grid");
      if (!res.ok) throw new Error("Failed to fetch budget");
      return res.json();
    },
  });

  const isLoading = summaryLoading || investmentsLoading || liabilitiesLoading || budgetLoading;

  // Build KPI cards from real data
  const netWorth = summary?.netWorth ?? 0;
  const totalAssets = summary?.totalAssets ?? 0;
  const totalDebt = summary?.totalLiabilities ?? 0;

  // Calculate monthly budget expenses from grid
  const budgetCategories = Object.keys(budgetGrid);
  const currentMonth = new Date().toLocaleString("en-US", { month: "short" }) + " '" + new Date().getFullYear().toString().slice(2);
  const monthlyExpenses = budgetCategories.reduce((sum, cat) => {
    const val = (budgetGrid as any)[cat]?.[currentMonth] || 0;
    return sum + val;
  }, 0);

  const KPI = [
    { label: "Net Worth", value: fmtCurrency(netWorth), icon: DollarSign, color: netWorth >= 0 ? "text-emerald-400" : "text-red-400" },
    { label: "Total Assets", value: fmtCurrency(totalAssets), icon: TrendingUp, color: "text-emerald-400" },
    { label: "Total Debt", value: fmtCurrency(totalDebt), icon: CreditCard, color: totalDebt > 0 ? "text-red-400" : "text-emerald-400" },
    { label: "Investments", value: String(summary?.investmentCount ?? 0), icon: Wallet, color: "text-blue-400" },
    { label: "Monthly Budget", value: monthlyExpenses > 0 ? fmtCurrency(monthlyExpenses) : "—", icon: PiggyBank, color: "text-neutral-400" },
  ];

  // Portfolio allocation from investments
  const investmentsByType: Record<string, number> = {};
  (investments as any[]).forEach((inv: any) => {
    const type = inv.type || "Other";
    const val = parseFloat(inv.current_value || inv.cost_basis || 0);
    investmentsByType[type] = (investmentsByType[type] || 0) + val;
  });
  const portfolioData = Object.entries(investmentsByType).map(([name, value], i) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="min-h-screen bg-neutral-900 p-4 md:p-8">
      {showWelcome && (
        <WelcomeAnimation
          userName={decodeURIComponent(welcomeName)}
          onComplete={handleWelcomeComplete}
        />
      )}

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-400 text-sm mt-1">Your financial overview</p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your data...
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {KPI.map(kpi => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="bg-neutral-800/50 border-neutral-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-neutral-400" />
                    <span className="text-xs text-neutral-400">{kpi.label}</span>
                  </div>
                  <div className={`text-xl font-bold text-white`}>{kpi.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Investments List */}
          <Card className="bg-neutral-800/50 border-neutral-700 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Investments</CardTitle>
            </CardHeader>
            <CardContent>
              {(investments as any[]).length === 0 ? (
                <EmptyState icon={TrendingUp} title="No investments tracked yet" cta="Add your first investment" href="/investments" />
              ) : (
                <div className="space-y-2">
                  {(investments as any[]).slice(0, 8).map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between py-1.5 border-b border-neutral-700/50 last:border-0">
                      <div>
                        <div className="text-sm text-white">{inv.name}</div>
                        <div className="text-xs text-neutral-500">{inv.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-neutral-300">{fmtCurrency(parseFloat(inv.current_value || inv.cost_basis || 0))}</div>
                        {inv.cost_basis && inv.current_value && parseFloat(inv.cost_basis) > 0 && (
                          <div className={`text-xs ${parseFloat(inv.current_value) >= parseFloat(inv.cost_basis) ? "text-emerald-400" : "text-red-400"}`}>
                            {parseFloat(inv.current_value) >= parseFloat(inv.cost_basis) ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />}
                            {(((parseFloat(inv.current_value) - parseFloat(inv.cost_basis)) / parseFloat(inv.cost_basis)) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(investments as any[]).length > 8 && (
                    <Button variant="link" size="sm" className="text-emerald-400 p-0" onClick={() => window.location.href = "/investments"}>
                      View all {(investments as any[]).length} investments →
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio Allocation */}
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Portfolio Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioData.length === 0 ? (
                <EmptyState icon={PiggyBank} title="No portfolio data yet" cta="Add investments" href="/investments" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                        {portfolioData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                        formatter={(v: number) => fmtCurrency(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {portfolioData.map(p => (
                      <div key={p.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-neutral-400">{p.name}</span>
                        </div>
                        <span className="text-neutral-300 font-mono">{fmtCurrency(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Liabilities */}
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Liabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(liabilities as any[]).length === 0 ? (
                <EmptyState icon={CreditCard} title="No liabilities tracked" cta="Add a liability" href="/liabilities" />
              ) : (
                <div className="space-y-3">
                  {(liabilities as any[]).slice(0, 5).map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white">{l.name}</div>
                        <div className="text-xs text-neutral-500">{l.type}{l.interest_rate ? ` · ${l.interest_rate}%` : ""}</div>
                      </div>
                      <span className="text-sm font-mono text-red-400">{fmtCurrency(parseFloat(l.current_balance || l.original_amount || 0))}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Summary */}
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgetCategories.length === 0 ? (
                <EmptyState icon={Receipt} title="No budget set up yet" cta="Set up your budget" href="/budget" />
              ) : (
                <div className="space-y-2">
                  {budgetCategories.slice(0, 6).map(cat => {
                    const val = (budgetGrid as any)[cat]?.[currentMonth] || 0;
                    return (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">{cat}</span>
                        <span className="text-sm font-mono text-neutral-300">{val > 0 ? fmtCurrency(val) : "—"}</span>
                      </div>
                    );
                  })}
                  {budgetCategories.length > 6 && (
                    <Button variant="link" size="sm" className="text-emerald-400 p-0" onClick={() => window.location.href = "/budget"}>
                      View full budget →
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions + AI */}
          <div className="space-y-4">
            <Card className="bg-neutral-800/50 border-neutral-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-300">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-700 justify-start text-xs" onClick={() => window.location.href = "/investments"}>
                  <Plus className="h-3 w-3 mr-1" /> Add Investment
                </Button>
                <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-700 justify-start text-xs" onClick={() => window.location.href = "/budget"}>
                  <Receipt className="h-3 w-3 mr-1" /> Edit Budget
                </Button>
                <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-700 justify-start text-xs" onClick={() => window.location.href = "/agent"}>
                  <Bot className="h-3 w-3 mr-1" /> Ask Agent
                </Button>
                <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-700 justify-start text-xs" onClick={() => window.location.href = "/liabilities"}>
                  <CreditCard className="h-3 w-3 mr-1" /> Manage Debt
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-neutral-800/50 border-neutral-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-400" /> AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-500 italic">
                  {totalAssets > 0
                    ? `You have ${summary?.investmentCount || 0} investments worth ${fmtCurrency(totalAssets)}. Ask your AI agent for personalized insights.`
                    : "Add some financial data and your agent will surface insights here."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
