import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, CreditCard, DollarSign, CalendarClock } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Liability {
  id: number;
  name: string;
  type: string;
  amount: number;
  interest_rate: number;
  minimum_payment: number;
  due_date?: string;
  notes?: string;
}

export default function Liabilities() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "loan", amount: "", interest_rate: "", minimum_payment: "" });
  const qc = useQueryClient();

  const { data: liabilities = [], isLoading } = useQuery<Liability[]>({
    queryKey: ["/api/liabilities"],
    queryFn: async () => { const r = await authFetch("/api/liabilities"); return r.json(); },
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await authFetch("/api/liabilities", { method: "POST", body: JSON.stringify(data) });
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/liabilities"] }); setOpen(false); setForm({ name: "", type: "loan", amount: "", interest_rate: "", minimum_payment: "" }); },
  });

  const totalDebt = liabilities.reduce((s, l) => s + Number(l.amount), 0);
  const totalMonthly = liabilities.reduce((s, l) => s + Number(l.minimum_payment || 0), 0);

  const handleSubmit = () => {
    addMutation.mutate({
      name: form.name, type: form.type,
      amount: parseFloat(form.amount) || 0,
      interest_rate: parseFloat(form.interest_rate) || 0,
      minimum_payment: parseFloat(form.minimum_payment) || 0,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Liabilities</h1>
            <p className="text-neutral-400 text-sm">Track and manage your debts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Add Liability</Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
              <DialogHeader><DialogTitle>Add Liability</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Creditor Name</Label><Input className="bg-neutral-800 border-neutral-700" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Chase Visa" /></div>
                  <div><Label>Type</Label><Input className="bg-neutral-800 border-neutral-700" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="credit card, loan, etc." /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Balance</Label><Input className="bg-neutral-800 border-neutral-700" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
                  <div><Label>Interest Rate %</Label><Input className="bg-neutral-800 border-neutral-700" type="number" value={form.interest_rate} onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))} placeholder="0" /></div>
                  <div><Label>Monthly Payment</Label><Input className="bg-neutral-800 border-neutral-700" type="number" value={form.minimum_payment} onChange={e => setForm(f => ({ ...f, minimum_payment: e.target.value }))} placeholder="0" /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={addMutation.isPending}>{addMutation.isPending ? "Adding..." : "Add Liability"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-red-500/10 p-2 rounded-lg"><CreditCard className="h-5 w-5 text-red-400" /></div>
              <div><p className="text-xs text-neutral-500">Total Debt</p><p className="text-xl font-bold text-red-400">{formatCurrency(totalDebt)}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-orange-500/10 p-2 rounded-lg"><CalendarClock className="h-5 w-5 text-orange-400" /></div>
              <div><p className="text-xs text-neutral-500">Monthly Payments</p><p className="text-xl font-bold text-orange-400">{formatCurrency(totalMonthly)}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Empty state */}
        {!isLoading && liabilities.length === 0 && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <CreditCard className="h-12 w-12 text-neutral-600 mb-4" />
              <p className="text-neutral-400 text-lg mb-2">No liabilities tracked</p>
              <p className="text-neutral-500 text-sm mb-4">Add your debts to start tracking your path to financial freedom.</p>
              <Button onClick={() => setOpen(true)} className="gap-2"><PlusCircle className="h-4 w-4" /> Add Your First Liability</Button>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        {liabilities.length > 0 && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                      <TableHead className="text-neutral-500">Creditor</TableHead>
                      <TableHead className="text-neutral-500">Type</TableHead>
                      <TableHead className="text-neutral-500 text-right">Balance</TableHead>
                      <TableHead className="text-neutral-500 text-right">Interest Rate</TableHead>
                      <TableHead className="text-neutral-500 text-right">Monthly Payment</TableHead>
                      <TableHead className="text-neutral-500 text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liabilities.map(l => (
                      <TableRow key={l.id} className="border-neutral-800 hover:bg-neutral-800/50">
                        <TableCell className="text-white font-medium">{l.name}</TableCell>
                        <TableCell className="text-neutral-400 capitalize">{l.type}</TableCell>
                        <TableCell className="text-right text-red-400 font-mono">{formatCurrency(Number(l.amount))}</TableCell>
                        <TableCell className="text-right text-neutral-300 font-mono">{Number(l.interest_rate)}%</TableCell>
                        <TableCell className="text-right text-neutral-300 font-mono">{formatCurrency(Number(l.minimum_payment || 0))}</TableCell>
                        <TableCell className="text-right text-neutral-400 font-mono">
                          {totalDebt > 0 ? (Number(l.amount) / totalDebt * 100).toFixed(1) + "%" : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-neutral-700 bg-neutral-800/30">
                      <TableCell className="text-white font-semibold" colSpan={2}>Total</TableCell>
                      <TableCell className="text-right text-red-400 font-mono font-semibold">{formatCurrency(totalDebt)}</TableCell>
                      <TableCell />
                      <TableCell className="text-right text-orange-400 font-mono font-semibold">{formatCurrency(totalMonthly)}</TableCell>
                      <TableCell className="text-right text-neutral-400 font-mono">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
