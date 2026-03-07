import React, { useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, ChevronLeft, ArrowRight as ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────
type MonthKey = string; // e.g. "2026-01"
interface RowDef {
  id: string;
  label: string;
  section: string;
  isComputed?: boolean; // auto-calculated rows
  computeFn?: (grid: GridData, month: MonthKey) => number;
  defaultValue?: number;
  indent?: number;
  isSectionHeader?: boolean;
  isSubtotal?: boolean;
  color?: "green" | "red" | "orange" | "blue" | "neutral";
  taxRate?: number; // informational
}
type GridData = Record<string, Record<string, number>>; // rowId -> monthKey -> value

// ── Helpers ────────────────────────────────────────────────────────────
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FY_YEAR = 2026;

function monthKeys(year: number): MonthKey[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}
function monthLabel(mk: MonthKey): string {
  const [y, m] = mk.split("-");
  return `${MONTHS_SHORT[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}
function fmt(v: number): string {
  if (v === 0) return "$0";
  const abs = Math.abs(v);
  if (abs >= 1000) {
    return (v < 0 ? "-" : "") + "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  return (v < 0 ? "-" : "") + "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── Row definitions ────────────────────────────────────────────────────
// Sections: Income, Deductions, Fixed Costs, Variable Costs, Savings
const sumRows = (ids: string[]) => (grid: GridData, m: MonthKey) =>
  ids.reduce((s, id) => s + (grid[id]?.[m] ?? 0), 0);

const ROWS: RowDef[] = [
  // ── INCOME ──
  { id: "_income_header", label: "INCOME", section: "Income", isSectionHeader: true, isComputed: true, computeFn: () => 0 },
  { id: "salary", label: "Salary (Pre-Tax 34%)", section: "Income", defaultValue: 0 },
  { id: "freelance", label: "Freelance (Taxed 41%)", section: "Income", defaultValue: 0 },
  { id: "secondary_income", label: "Secondary Income", section: "Income", defaultValue: 0 },
  { id: "non_taxed_income", label: "Non-taxed Income", section: "Income", defaultValue: 0 },
  { id: "total_income", label: "Total Income", section: "Income", isComputed: true, isSubtotal: true, color: "green",
    computeFn: sumRows(["salary", "freelance", "secondary_income", "non_taxed_income"]) },

  // ── DEDUCTIONS ──
  { id: "_deductions_header", label: "DEDUCTIONS", section: "Deductions", isSectionHeader: true, isComputed: true, computeFn: () => 0 },
  { id: "tax_withholding", label: "Tax + Withholding", section: "Deductions", defaultValue: 0 },
  { id: "401k", label: "401k Contribution", section: "Deductions", defaultValue: 0 },
  { id: "net_take_home", label: "Net Take Home", section: "Deductions", isComputed: true, isSubtotal: true, color: "green",
    computeFn: (grid, m) => {
      const inc = sumRows(["salary", "freelance", "secondary_income", "non_taxed_income"])(grid, m);
      const ded = sumRows(["tax_withholding", "401k"])(grid, m);
      return inc - ded;
    }
  },

  // ── FIXED COSTS (40%) ──
  { id: "_fixed_header", label: "FIXED COSTS (40%)", section: "Fixed Costs", isSectionHeader: true, isComputed: true, computeFn: () => 0 },
  { id: "rent", label: "Rent", section: "Fixed Costs", defaultValue: 4700 },
  { id: "utilities", label: "Utilities", section: "Fixed Costs", defaultValue: 346 },
  { id: "groceries", label: "Groceries", section: "Fixed Costs", defaultValue: 500 },
  { id: "car", label: "Car", section: "Fixed Costs", defaultValue: 0 },
  { id: "ridesharing", label: "Ridesharing", section: "Fixed Costs", defaultValue: 240 },
  { id: "metro", label: "Metro", section: "Fixed Costs", defaultValue: 96 },
  { id: "total_fixed", label: "Total Fixed Costs", section: "Fixed Costs", isComputed: true, isSubtotal: true, color: "red",
    computeFn: sumRows(["rent", "utilities", "groceries", "car", "ridesharing", "metro"]) },

  // ── VARIABLE COSTS (20%) ──
  { id: "_variable_header", label: "VARIABLE COSTS (20%)", section: "Variable Costs", isSectionHeader: true, isComputed: true, computeFn: () => 0 },
  { id: "sts_weekdays", label: "Safe to Spend Weekdays", section: "Variable Costs", defaultValue: 1700 },
  { id: "sts_weekends", label: "Safe to Spend Weekends", section: "Variable Costs", defaultValue: 960 },
  { id: "entertainment", label: "Entertainment", section: "Variable Costs", defaultValue: 200 },
  { id: "subscriptions", label: "Subscriptions", section: "Variable Costs", defaultValue: 113 },
  { id: "total_variable", label: "Total Variable Costs", section: "Variable Costs", isComputed: true, isSubtotal: true, color: "red",
    computeFn: sumRows(["sts_weekdays", "sts_weekends", "entertainment", "subscriptions"]) },

  // ── SAVINGS GOALS (20%) ──
  { id: "_savings_header", label: "SAVINGS GOALS (20%)", section: "Savings Goals", isSectionHeader: true, isComputed: true, computeFn: () => 0 },
  { id: "emergency_fund", label: "Emergency Fund", section: "Savings Goals", defaultValue: 0 },
  { id: "investments", label: "Investments", section: "Savings Goals", defaultValue: 0 },
  { id: "debt_repayment", label: "Debt Repayment", section: "Savings Goals", defaultValue: 0 },
  { id: "total_savings", label: "Total Savings Goals", section: "Savings Goals", isComputed: true, isSubtotal: true, color: "blue",
    computeFn: sumRows(["emergency_fund", "investments", "debt_repayment"]) },

  // ── BUFFER ──
  { id: "buffer", label: "BUFFER", section: "Buffer", isComputed: true, isSubtotal: true,
    computeFn: (grid, m) => {
      const netHome = (() => {
        const inc = sumRows(["salary", "freelance", "secondary_income", "non_taxed_income"])(grid, m);
        const ded = sumRows(["tax_withholding", "401k"])(grid, m);
        return inc - ded;
      })();
      const fixed = sumRows(["rent", "utilities", "groceries", "car", "ridesharing", "metro"])(grid, m);
      const variable = sumRows(["sts_weekdays", "sts_weekends", "entertainment", "subscriptions"])(grid, m);
      const savings = sumRows(["emergency_fund", "investments", "debt_repayment"])(grid, m);
      return netHome - fixed - variable - savings;
    }
  },
];

function buildDefaultGrid(): GridData {
  const grid: GridData = {};
  const months = monthKeys(FY_YEAR);
  for (const row of ROWS) {
    if (row.isComputed) continue;
    grid[row.id] = {};
    for (const m of months) {
      grid[row.id][m] = row.defaultValue ?? 0;
    }
  }
  return grid;
}

function getCellValue(row: RowDef, grid: GridData, month: MonthKey): number {
  if (row.isComputed && row.computeFn) return row.computeFn(grid, month);
  return grid[row.id]?.[month] ?? 0;
}

function getFyTotal(row: RowDef, grid: GridData): number {
  return monthKeys(FY_YEAR).reduce((s, m) => s + getCellValue(row, grid, m), 0);
}

// ── Editable cell ──────────────────────────────────────────────────────
function EditableCell({ value, onChange, disabled, className }: {
  value: number; onChange: (v: number) => void; disabled?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (disabled) return;
    setDraft(value.toString());
    setEditing(true);
  };

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const n = parseFloat(draft);
    if (!isNaN(n) && n !== value) onChange(n);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="w-full bg-neutral-800 text-white text-right px-2 py-1 text-sm outline-none ring-1 ring-emerald-500 rounded-sm font-mono"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      className={cn(
        "text-right px-2 py-1.5 text-sm font-mono cursor-pointer hover:bg-neutral-800/60 rounded-sm transition-colors select-none",
        disabled && "cursor-default hover:bg-transparent",
        className
      )}
    >
      {fmt(value)}
    </div>
  );
}

// ── Color helpers ──────────────────────────────────────────────────────
function valueCellColor(val: number, row: RowDef): string {
  if (row.id === "buffer") return val < 0 ? "text-red-400" : val > 0 ? "text-emerald-400" : "text-neutral-400";
  if (row.isSubtotal && row.color === "green") return val > 0 ? "text-emerald-400" : val < 0 ? "text-red-400" : "text-neutral-400";
  if (row.isSubtotal && row.color === "red") return "text-orange-400";
  if (row.isSubtotal && row.color === "blue") return "text-sky-400";
  if (val < 0) return "text-red-400";
  if (val === 0 && ["salary", "freelance", "secondary_income"].includes(row.id)) return "text-red-400/60";
  return "text-neutral-200";
}

// ── Main component ─────────────────────────────────────────────────────
export default function Budget() {
  const [grid, setGrid] = useState<GridData>(buildDefaultGrid);
  const allMonths = monthKeys(FY_YEAR);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [scrollMonth, setScrollMonth] = useState(0); // index for mobile
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const updateCell = useCallback((rowId: string, month: MonthKey, value: number) => {
    setGrid(prev => ({
      ...prev,
      [rowId]: { ...prev[rowId], [month]: value }
    }));
  }, []);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section); else next.add(section);
      return next;
    });
  };

  // Visible months for mobile
  const visibleMonths = isMobile ? [allMonths[scrollMonth]] : allMonths;

  // Section grouping for rendering
  const sections = ROWS.reduce<{ section: string; rows: RowDef[] }[]>((acc, row) => {
    if (row.isSectionHeader) {
      acc.push({ section: row.section, rows: [] });
    } else if (acc.length > 0) {
      acc[acc.length - 1].rows.push(row);
    }
    return acc;
  }, []);
  // Buffer row is standalone
  const bufferRow = ROWS.find(r => r.id === "buffer")!;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Budget</h1>
            <p className="text-xs text-neutral-500">FY {FY_YEAR}</p>
          </div>
          {/* Mobile month navigator */}
          {isMobile && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={scrollMonth === 0}
                onClick={() => setScrollMonth(p => Math.max(0, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-16 text-center">{monthLabel(allMonths[scrollMonth])}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={scrollMonth === 11}
                onClick={() => setScrollMonth(p => Math.min(11, p + 1))}>
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1600px] mx-auto" ref={containerRef}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            {/* Column headers */}
            <thead className="sticky top-[57px] z-10">
              <tr className="bg-neutral-900 border-b border-neutral-800">
                <th className="sticky left-0 z-10 bg-neutral-900 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-2 w-[220px] min-w-[220px]">
                  Category
                </th>
                {visibleMonths.map(m => (
                  <th key={m} className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-2 py-2 min-w-[100px]">
                    {monthLabel(m)}
                  </th>
                ))}
                {!isMobile && (
                  <th className="text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 py-2 min-w-[110px] bg-neutral-900/90">
                    FY Total
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sections.map(({ section, rows }) => {
                const collapsed = collapsedSections.has(section);
                const headerRow = ROWS.find(r => r.isSectionHeader && r.section === section)!;
                return (
                  <React.Fragment key={section}>
                    {/* Section header */}
                    <tr
                      className="cursor-pointer hover:bg-neutral-800/40 transition-colors group"
                      onClick={() => toggleSection(section)}
                    >
                      <td className="sticky left-0 z-[5] bg-neutral-950 px-4 py-2 flex items-center gap-1.5">
                        {collapsed
                          ? <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
                          : <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                        }
                        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          {headerRow.label}
                        </span>
                      </td>
                      {visibleMonths.map(m => <td key={m} />)}
                      {!isMobile && <td />}
                    </tr>

                    {/* Data rows */}
                    {!collapsed && rows.map(row => {
                      const isEditable = !row.isComputed;
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            "border-b border-neutral-800/40 transition-colors",
                            row.isSubtotal && "bg-neutral-900/50",
                            !row.isSubtotal && "hover:bg-neutral-800/20"
                          )}
                        >
                          <td className={cn(
                            "sticky left-0 z-[5] bg-neutral-950 px-4 py-1.5 text-sm whitespace-nowrap",
                            row.isSubtotal ? "font-semibold text-neutral-300" : "text-neutral-400 pl-8"
                          )}>
                            {row.label}
                          </td>
                          {visibleMonths.map(m => {
                            const val = getCellValue(row, grid, m);
                            return (
                              <td key={m} className="px-0 py-0">
                                {isEditable ? (
                                  <EditableCell
                                    value={val}
                                    onChange={v => updateCell(row.id, m, v)}
                                    className={valueCellColor(val, row)}
                                  />
                                ) : (
                                  <div className={cn(
                                    "text-right px-2 py-1.5 text-sm font-mono",
                                    row.isSubtotal && "font-semibold",
                                    valueCellColor(val, row)
                                  )}>
                                    {fmt(val)}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          {!isMobile && (
                            <td className="bg-neutral-900/40">
                              <div className={cn(
                                "text-right px-3 py-1.5 text-sm font-mono font-semibold",
                                valueCellColor(getFyTotal(row, grid), row)
                              )}>
                                {fmt(getFyTotal(row, grid))}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Buffer row */}
              <tr className="border-t-2 border-neutral-700 bg-neutral-900/70">
                <td className="sticky left-0 z-[5] bg-neutral-900/70 px-4 py-2.5 text-sm font-bold text-neutral-200 uppercase tracking-wide">
                  {bufferRow.label}
                </td>
                {visibleMonths.map(m => {
                  const val = getCellValue(bufferRow, grid, m);
                  return (
                    <td key={m}>
                      <div className={cn(
                        "text-right px-2 py-2 text-sm font-mono font-bold",
                        val < 0 ? "text-red-400" : val > 0 ? "text-emerald-400" : "text-neutral-500"
                      )}>
                        {fmt(val)}
                      </div>
                    </td>
                  );
                })}
                {!isMobile && (
                  <td className="bg-neutral-900/60">
                    <div className={cn(
                      "text-right px-3 py-2 text-sm font-mono font-bold",
                      (() => { const v = getFyTotal(bufferRow, grid); return v < 0 ? "text-red-400" : v > 0 ? "text-emerald-400" : "text-neutral-500"; })()
                    )}>
                      {fmt(getFyTotal(bufferRow, grid))}
                    </div>
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card view for current month */}
      {isMobile && (
        <div className="px-4 py-4 space-y-3">
          {sections.map(({ section, rows }) => {
            const m = allMonths[scrollMonth];
            const subtotalRow = rows.find(r => r.isSubtotal);
            const dataRows = rows.filter(r => !r.isSubtotal);
            return (
              <div key={section} className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-neutral-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{section}</span>
                  {subtotalRow && (
                    <span className={cn("text-sm font-mono font-semibold", valueCellColor(getCellValue(subtotalRow, grid, m), subtotalRow))}>
                      {fmt(getCellValue(subtotalRow, grid, m))}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-neutral-800/50">
                  {dataRows.map(row => {
                    const val = getCellValue(row, grid, m);
                    return (
                      <div key={row.id} className="px-4 py-2 flex justify-between items-center">
                        <span className="text-sm text-neutral-400">{row.label}</span>
                        {!row.isComputed ? (
                          <EditableCell value={val} onChange={v => updateCell(row.id, m, v)} className={cn("w-24", valueCellColor(val, row))} />
                        ) : (
                          <span className={cn("text-sm font-mono", valueCellColor(val, row))}>{fmt(val)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Buffer card */}
          <div className="bg-neutral-900 rounded-lg border border-neutral-700 px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-bold text-neutral-200 uppercase">Buffer</span>
            <span className={cn("text-lg font-mono font-bold", (() => {
              const v = getCellValue(bufferRow, grid, allMonths[scrollMonth]);
              return v < 0 ? "text-red-400" : v > 0 ? "text-emerald-400" : "text-neutral-500";
            })())}>
              {fmt(getCellValue(bufferRow, grid, allMonths[scrollMonth]))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
