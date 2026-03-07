import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Filter, Search, BanknoteIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Placeholder — will connect to Plaid transactions API once bank is linked
export default function CashFlow() {
  const [dateRange, setDateRange] = useState("30d");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Cash Flow</h1>
          <p className="text-neutral-400 text-sm">Track your income and expenses over time</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-lg"><ArrowDownLeft className="h-5 w-5 text-emerald-400" /></div>
              <div><p className="text-xs text-neutral-500">Total In</p><p className="text-xl font-bold text-emerald-400">$0.00</p></div>
            </CardContent>
          </Card>
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-red-500/10 p-2 rounded-lg"><ArrowUpRight className="h-5 w-5 text-red-400" /></div>
              <div><p className="text-xs text-neutral-500">Total Out</p><p className="text-xl font-bold text-red-400">$0.00</p></div>
            </CardContent>
          </Card>
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-sky-500/10 p-2 rounded-lg"><ArrowLeftRight className="h-5 w-5 text-sky-400" /></div>
              <div><p className="text-xs text-neutral-500">Net</p><p className="text-xl font-bold text-sky-400">$0.00</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] bg-neutral-900 border-neutral-700 text-neutral-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px] bg-neutral-900 border-neutral-700 text-neutral-300"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="food">Food & Drink</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
              <SelectItem value="bills">Bills</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input className="bg-neutral-900 border-neutral-700 pl-9 text-neutral-300" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Empty state */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <BanknoteIcon className="h-12 w-12 text-neutral-600 mb-4" />
            <p className="text-neutral-400 text-lg mb-2">No transactions yet</p>
            <p className="text-neutral-500 text-sm mb-4 text-center max-w-md">
              Connect your bank account to automatically import transactions and track your cash flow.
            </p>
            <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
              Connect Bank Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
