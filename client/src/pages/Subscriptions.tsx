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
import { PlusCircle, Repeat, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Subscription {
  id: number;
  name: string;
  category: string;
  amount: number;
  due_date?: string;
  frequency: string;
  is_active: boolean;
}

const CATEGORIES = ["Bills", "Subscriptions", "Business"];

export default function Subscriptions() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Subscriptions", amount: "", due_date: "", frequency: "monthly" });
  const qc = useQueryClient();

  const { data: subs = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: async () => { const r = await authFetch("/api/subscriptions"); return r.json(); },
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await authFetch("/api/subscriptions", { method: "POST", body: JSON.stringify(data) });
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/subscriptions"] }); setOpen(false); setForm({ name: "", category: "Subscriptions", amount: "", due_date: "", frequency: "monthly" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await authFetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/subscriptions"] }); },
  });

  const grouped = CATEGORIES.reduce<Record<string, Subscription[]>>((acc, cat) => {
    const items = subs.filter(s => s.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
  const uncategorized = subs.filter(s => !CATEGORIES.includes(s.category));
  if (uncategorized.length) grouped["Other"] = uncategorized;

  const totalMonthly = subs.reduce((s, sub) => s + Number(sub.amount), 0);

  const handleSubmit = () => {
    addMutation.mutate({
      name: form.name, category: form.category,
      amount: parseFloat(form.amount) || 0,
      due_date: form.due_date || null,
      frequency: form.frequency,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
            <p className="text-neutral-400 text-sm">Manage recurring expenses — {formatCurrency(totalMonthly)}/mo</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Add</Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-700 text-white">
              <DialogHeader><DialogTitle>Add Subscription</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div><Label>Name</Label><Input className="bg-neutral-800 border-neutral-700" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Netflix" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="bg-neutral-800 border-neutral-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Amount</Label><Input className="bg-neutral-800 border-neutral-700" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="15.99" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Due Date</Label><Input className="bg-neutral-800 border-neutral-700" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} placeholder="1st, 15th, etc." /></div>
                  <div><Label>Frequency</Label>
                    <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                      <SelectTrigger className="bg-neutral-800 border-neutral-700"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={addMutation.isPending}>{addMutation.isPending ? "Adding..." : "Add"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Empty state */}
        {!isLoading && subs.length === 0 && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Repeat className="h-12 w-12 text-neutral-600 mb-4" />
              <p className="text-neutral-400 text-lg mb-2">No subscriptions tracked</p>
              <p className="text-neutral-500 text-sm mb-4">Add your recurring bills, subscriptions, and business expenses.</p>
              <Button onClick={() => setOpen(true)} className="gap-2"><PlusCircle className="h-4 w-4" /> Add Your First Subscription</Button>
            </CardContent>
          </Card>
        )}

        {/* Grouped tables */}
        {Object.entries(grouped).map(([category, items]) => {
          const catTotal = items.reduce((s, i) => s + Number(i.amount), 0);
          return (
            <Card key={category} className="bg-neutral-900 border-neutral-800 mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-neutral-300 flex justify-between">
                  <span>{category}</span>
                  <span className="text-orange-400 font-mono">{formatCurrency(catTotal)}/mo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                      <TableHead className="text-neutral-500">Name</TableHead>
                      <TableHead className="text-neutral-500">Frequency</TableHead>
                      <TableHead className="text-neutral-500 text-right">Amount</TableHead>
                      <TableHead className="text-neutral-500 text-right">Due Date</TableHead>
                      <TableHead className="text-neutral-500 w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(sub => (
                      <TableRow key={sub.id} className="border-neutral-800 hover:bg-neutral-800/50">
                        <TableCell className="text-white font-medium">{sub.name}</TableCell>
                        <TableCell className="text-neutral-400 capitalize">{sub.frequency}</TableCell>
                        <TableCell className="text-right text-neutral-300 font-mono">{formatCurrency(Number(sub.amount))}</TableCell>
                        <TableCell className="text-right text-neutral-400">{sub.due_date || "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-red-400" onClick={() => deleteMutation.mutate(sub.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
