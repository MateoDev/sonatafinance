import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, TrendingUp, Wallet, DollarSign } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface Investment {
  id: number;
  symbol: string;
  name: string;
  type: string;
  category: string;
  price: number;
  quantity: number;
  cost_basis: number;
  notes?: string;
}

const CATEGORIES = ["Cash/Savings", "Private Equity", "Crypto", "Stocks", "Real Estate", "Other"];

export default function Investments() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ symbol: "", name: "", type: "stock", category: "Stocks", price: "", quantity: "", cost_basis: "" });
  const qc = useQueryClient();

  const { data: investments = [], isLoading } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
    queryFn: async () => { const r = await authFetch("/api/investments"); return r.json(); },
    refetchOnMount: true,
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await authFetch("/api/investments", { method: "POST", body: JSON.stringify(data) });
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/investments"] }); setOpen(false); setForm({ symbol: "", name: "", type: "stock", category: "Stocks", price: "", quantity: "", cost_basis: "" }); },
  });

  const totalValue = investments.reduce((s, i) => s + (Number(i.price) * Number(i.quantity)), 0);
  const totalCost = investments.reduce((s, i) => s + Number(i.cost_basis), 0);

  const grouped = CATEGORIES.reduce<Record<string, Investment[]>>((acc, cat) => {
    const items = investments.filter(i => i.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
  // Add uncategorized
  const categorized = new Set(Object.values(grouped).flat().map(i => i.id));
  const uncategorized = investments.filter(i => !categorized.has(i.id));
  if (uncategorized.length) grouped["Other"] = [...(grouped["Other"] || []), ...uncategorized];

  const handleSubmit = () => {
    addMutation.mutate({
      symbol: form.symbol, name: form.name, type: form.type, category: form.category,
      price: parseFloat(form.price) || 0, quantity: parseFloat(form.quantity) || 1,
      cost_basis: parseFloat(form.cost_basis) || 0,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Investments</h1>
            <p className="text-neutral-400 text-sm">Your portfolio at a glance</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Add Investment</Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
              <DialogHeader><DialogTitle>Add Investment</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Symbol</Label><Input className="bg-neutral-800 border-neutral-700" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="AAPL" /></div>
                  <div><Label>Name</Label><Input className="bg-neutral-800 border-neutral-700" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Apple Inc" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label><Input className="bg-neutral-800 border-neutral-700" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="stock" /></div>
                  <div><Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="bg-neutral-800 border-neutral-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Price</Label><Input className="bg-neutral-800 border-neutral-700" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" /></div>
                  <div><Label>Quantity</Label><Input className="bg-neutral-800 border-neutral-700" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="1" /></div>
                  <div><Label>Cost Basis</Label><Input className="bg-neutral-800 border-neutral-700" type="number" value={form.cost_basis} onChange={e => setForm(f => ({ ...f, cost_basis: e.target.value }))} placeholder="0" /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={addMutation.isPending}>{addMutation.isPending ? "Adding..." : "Add Investment"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-lg"><Wallet className="h-5 w-5 text-emerald-400" /></div>
              <div><p className="text-xs text-neutral-500">Total Value</p><p className="text-xl font-bold text-white">{formatCurrency(totalValue)}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-sky-500/10 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-sky-400" /></div>
              <div><p className="text-xs text-neutral-500">Total Principal</p><p className="text-xl font-bold text-white">{formatCurrency(totalCost)}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${totalValue - totalCost >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"} p-2 rounded-lg`}>
                <TrendingUp className={`h-5 w-5 ${totalValue - totalCost >= 0 ? "text-emerald-400" : "text-red-400"}`} />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Gain / Loss</p>
                <p className={`text-xl font-bold ${totalValue - totalCost >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {totalValue - totalCost >= 0 ? "+" : ""}{formatCurrency(totalValue - totalCost)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty state */}
        {!isLoading && investments.length === 0 && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Wallet className="h-12 w-12 text-neutral-600 mb-4" />
              <p className="text-neutral-400 text-lg mb-2">No investments yet</p>
              <p className="text-neutral-500 text-sm mb-4">Start building your portfolio by adding your first investment.</p>
              <Button onClick={() => setOpen(true)} className="gap-2"><PlusCircle className="h-4 w-4" /> Add Your First Investment</Button>
            </CardContent>
          </Card>
        )}

        {/* Grouped tables */}
        {Object.entries(grouped).map(([category, items]) => {
          const catValue = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
          return (
            <Card key={category} className="bg-neutral-900 border-neutral-800 mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-neutral-300 flex justify-between">
                  <span>{category}</span>
                  <span className="text-emerald-400 font-mono">{formatCurrency(catValue)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-neutral-800 hover:bg-transparent">
                        <TableHead className="text-neutral-500">Name</TableHead>
                        <TableHead className="text-neutral-500">Type</TableHead>
                        <TableHead className="text-neutral-500 text-right">Qty</TableHead>
                        <TableHead className="text-neutral-500 text-right">Principal</TableHead>
                        <TableHead className="text-neutral-500 text-right">Current Value</TableHead>
                        <TableHead className="text-neutral-500 text-right">% Portfolio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(inv => {
                        const val = Number(inv.price) * Number(inv.quantity);
                        return (
                          <TableRow key={inv.id} className="border-neutral-800 hover:bg-neutral-800/50">
                            <TableCell className="text-white">
                              <div className="font-medium">{inv.name}</div>
                              {inv.symbol && <div className="text-xs text-neutral-500">{inv.symbol}</div>}
                            </TableCell>
                            <TableCell className="text-neutral-400 capitalize">{inv.type}</TableCell>
                            <TableCell className="text-right text-neutral-300 font-mono">{Number(inv.quantity)}</TableCell>
                            <TableCell className="text-right text-neutral-300 font-mono">{formatCurrency(Number(inv.cost_basis))}</TableCell>
                            <TableCell className="text-right text-white font-mono">{formatCurrency(val)}</TableCell>
                            <TableCell className="text-right text-neutral-400 font-mono">
                              {totalValue > 0 ? (val / totalValue * 100).toFixed(1) + "%" : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
