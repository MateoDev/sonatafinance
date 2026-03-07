import { useState, useCallback } from "react";
import { WelcomeAnimation } from "@/components/WelcomeAnimation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  PiggyBank,
  ShieldCheck,
  Plus,
  Receipt,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// KPI data from Matt's spreadsheet
const KPI = [
  { label: "Net Worth", value: "$17,251,245", icon: DollarSign, change: "+4.2%", up: true, color: "text-emerald-400" },
  { label: "Monthly Income", value: "$5,208", icon: TrendingUp, change: "+1.8%", up: true, color: "text-emerald-400" },
  { label: "Total Debt", value: "$118,877", icon: CreditCard, change: "-2.1%", up: false, color: "text-emerald-400" },
  { label: "Monthly Expenses", value: "$4,120", icon: Wallet, change: "+5.3%", up: true, color: "text-red-400" },
  { label: "Savings", value: "$100,000", icon: PiggyBank, change: "+0.5%", up: true, color: "text-emerald-400" },
  { label: "Credit Score", value: "600", icon: ShieldCheck, change: "-10", up: false, color: "text-orange-400" },
];

const netWorthTrend = [
  { month: "Sep", value: 15800000 },
  { month: "Oct", value: 16100000 },
  { month: "Nov", value: 16400000 },
  { month: "Dec", value: 16700000 },
  { month: "Jan", value: 16900000 },
  { month: "Feb", value: 17100000 },
  { month: "Mar", value: 17251245 },
];

const portfolioData = [
  { name: "Real Estate", value: 12500000, color: "#10b981" },
  { name: "Stocks", value: 2800000, color: "#3b82f6" },
  { name: "Crypto", value: 950000, color: "#f59e0b" },
  { name: "Cash", value: 600000, color: "#8b5cf6" },
  { name: "Other", value: 401245, color: "#6b7280" },
];

const upcomingPayments = [
  { name: "Rent", amount: 4700, date: "Mar 1", paid: true },
  { name: "Car Insurance", amount: 180, date: "Mar 8", paid: false },
  { name: "Phone Bill", amount: 85, date: "Mar 10", paid: false },
  { name: "Gym Membership", amount: 45, date: "Mar 12", paid: false },
];

const recentTransactions = [
  { name: "Salary Deposit", amount: 5208, type: "income", date: "Mar 1" },
  { name: "Rent Payment", amount: -4700, type: "expense", date: "Mar 1" },
  { name: "Grocery Store", amount: -127.54, type: "expense", date: "Mar 3" },
  { name: "Uber Ride", amount: -24.50, type: "expense", date: "Mar 4" },
  { name: "Freelance Payment", amount: 850, type: "income", date: "Mar 5" },
];

function fmtCurrency(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v < 0 ? "-" : "") + "$" + (abs / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (v < 0 ? "-" : "") + "$" + abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return (v < 0 ? "-" : "") + "$" + abs.toFixed(2);
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {KPI.map(kpi => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="bg-neutral-800/50 border-neutral-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-neutral-400" />
                    <span className="text-xs text-neutral-400">{kpi.label}</span>
                  </div>
                  <div className="text-xl font-bold text-white">{kpi.value}</div>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.color}`}>
                    {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {kpi.change}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Net Worth Trend */}
          <Card className="bg-neutral-800/50 border-neutral-700 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Net Worth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={netWorthTrend}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} />
                  <YAxis
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={false}
                    tickFormatter={v => `$${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                    labelStyle={{ color: "#9ca3af" }}
                    formatter={(v: number) => [fmtCurrency(v), "Net Worth"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#nwGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Portfolio Allocation */}
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Portfolio Allocation</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Upcoming Payments */}
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Upcoming Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingPayments.map(p => (
                <div key={p.name} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white">{p.name}</div>
                    <div className="text-xs text-neutral-500">{p.date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-neutral-300">${p.amount}</span>
                    {p.paid && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Paid</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-neutral-800/50 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-300">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTransactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white">{t.name}</div>
                    <div className="text-xs text-neutral-500">{t.date}</div>
                  </div>
                  <span className={`text-sm font-mono ${t.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {t.amount > 0 ? "+" : ""}{fmtCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Right column: Quick Actions + AI Insights */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card className="bg-neutral-800/50 border-neutral-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-300">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-700 justify-start text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Investment
                </Button>
                <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-700 justify-start text-xs">
                  <Receipt className="h-3 w-3 mr-1" /> Log Expense
                </Button>
                <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-700 justify-start text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" /> View Reports
                </Button>
                <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:bg-neutral-700 justify-start text-xs">
                  <CreditCard className="h-3 w-3 mr-1" /> Pay Debt
                </Button>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="bg-neutral-800/50 border-neutral-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-400" /> AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-neutral-500 italic">Your agent will surface insights here.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
