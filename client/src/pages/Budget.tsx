import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronDown, 
  Download, 
  Filter, 
  Calendar, 
  PlusCircle, 
  ArrowLeft, 
  ArrowRight,
  Save,
  Edit,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

// Sample data to match the Excel spreadsheet format
const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const currentYear = 2025;
const currentMonth = "Apr";

// Define interfaces for budget data
interface BudgetItem {
  id: number;
  name: string;
  amount: number;
  monthly: number;
  category?: string;
}

interface BudgetCategory {
  name: string;
  isExpanded: boolean;
  items: BudgetItem[];
  total: number;
  monthlyTotal: number;
}

// Process budget data into categories
const processBudgetData = (data: any[] | undefined): BudgetCategory[] => {
  if (!data || !Array.isArray(data)) {
    // Return default categories if no data
    return [
      { 
        name: "Income", 
        isExpanded: true,
        items: [
          { id: 1, name: "Salary (Pre-Tax)", amount: 30000, monthly: 2500 },
          { id: 2, name: "Investment Income", amount: 5000, monthly: 416.67 },
        ],
        total: 35000,
        monthlyTotal: 2916.67
      },
      { 
        name: "Housing", 
        isExpanded: true,
        items: [
          { id: 3, name: "Rent", amount: 36000, monthly: 3000 },
          { id: 4, name: "Utilities", amount: 4800, monthly: 400 },
        ],
        total: 40800,
        monthlyTotal: 3400
      }
    ];
  }
  
  // Group budget items by category
  const categoryMap: Record<string, any[]> = data.reduce((groups: Record<string, any[]>, item: any) => {
    const category = item.category || "Uncategorized";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});
  
  // Convert to category format
  return Object.entries(categoryMap).map(([name, items]) => {
    const processedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      amount: item.amount || 0,
      monthly: (item.amount / 12) || 0,
    }));
    
    const total = processedItems.reduce((sum, item) => sum + item.amount, 0);
    const monthlyTotal = processedItems.reduce((sum, item) => sum + item.monthly, 0);
    
    return {
      name,
      isExpanded: true,
      items: processedItems,
      total,
      monthlyTotal
    };
  });
};

// Initialize categories with default values which will be updated when data loads
const initialCategories = processBudgetData([]);

// Function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export default function Budget() {
  const { toast } = useToast();
  const [budgetCategories, setBudgetCategories] = useState(initialCategories);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<{categoryIndex: number, itemIndex: number} | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  
  const { data: budgetItems, isLoading } = useQuery<BudgetItem[]>({
    queryKey: ["/api/budget"],
  });
  
  // Update budget categories when data loads
  useEffect(() => {
    if (budgetItems) {
      const processedCategories = processBudgetData(budgetItems);
      setBudgetCategories(processedCategories);
    }
  }, [budgetItems]);

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    if (isEditMode) return; // Prevent category toggling while in edit mode
    
    setBudgetCategories(prevCategories => 
      prevCategories.map(category => 
        category.name === categoryName 
          ? { ...category, isExpanded: !category.isExpanded } 
          : category
      )
    );
  };
  
  // Enter edit mode for a budget item
  const handleItemClick = (categoryIndex: number, itemIndex: number) => {
    if (!isEditMode) {
      const category = budgetCategories[categoryIndex];
      const item = category.items[itemIndex];
      const value = viewMode === 'monthly' ? item.monthly : item.amount;
      
      setEditingItem({ categoryIndex, itemIndex });
      setEditValue(value.toString());
      setIsEditMode(true);
      
      // Focus the input after it renders
      setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus();
          editInputRef.current.select();
        }
      }, 10);
    }
  };
  
  // Save edited budget item value
  const saveItemEdit = () => {
    if (!editingItem) return;
    
    // Validate input
    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid number",
        variant: "destructive"
      });
      return;
    }
    
    // Update the budget item
    setBudgetCategories(prev => {
      const newCategories = [...prev];
      const { categoryIndex, itemIndex } = editingItem;
      const category = {...newCategories[categoryIndex]};
      const items = [...category.items];
      const item = {...items[itemIndex]};
      
      if (viewMode === 'monthly') {
        const oldMonthly = item.monthly;
        item.monthly = numValue;
        item.amount = item.amount * (numValue / oldMonthly); // Keep annual value in proportion
      } else {
        const oldAmount = item.amount;
        item.amount = numValue;
        item.monthly = item.monthly * (numValue / oldAmount); // Keep monthly value in proportion
      }
      
      items[itemIndex] = item;
      category.items = items;
      
      // Recalculate category totals
      category.total = category.items.reduce((sum, item) => sum + item.amount, 0);
      category.monthlyTotal = category.items.reduce((sum, item) => sum + item.monthly, 0);
      
      newCategories[categoryIndex] = category;
      return newCategories;
    });
    
    toast({
      title: "Budget updated",
      description: "Your budget item has been updated successfully"
    });
    
    // Exit edit mode
    setIsEditMode(false);
    setEditingItem(null);
  };
  
  // Cancel editing
  const cancelItemEdit = () => {
    setIsEditMode(false);
    setEditingItem(null);
  };
  
  // Handle keyboard events in edit mode
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveItemEdit();
    } else if (e.key === 'Escape') {
      cancelItemEdit();
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(months[currentIndex - 1]);
    } else {
      setSelectedMonth(months[months.length - 1]);
      setSelectedYear(selectedYear - 1);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    if (currentIndex < months.length - 1) {
      setSelectedMonth(months[currentIndex + 1]);
    } else {
      setSelectedMonth(months[0]);
      setSelectedYear(selectedYear + 1);
    }
  };

  // Calculate totals
  const totalIncome = budgetCategories.find(cat => cat.name === "Income")?.monthlyTotal || 0;
  const totalExpenses = budgetCategories
    .filter(cat => cat.name !== "Income")
    .reduce((sum, cat) => sum + cat.monthlyTotal, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = (netSavings / totalIncome) * 100;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Budget Planner</h1>
      </div>

      {/* Budget View Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[90px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
              <SelectTrigger className="w-[90px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as 'monthly' | 'annual')}>
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">Annual</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Item</span>
          </Button>
        </div>
      </div>

      {/* Monthly overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Summary - {selectedMonth} {selectedYear}</CardTitle>
          <CardDescription>Overview of your financial situation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-600">Monthly Income</p>
                  <p className="text-xl font-semibold text-green-600">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-600">Monthly Expenses</p>
                  <p className="text-xl font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-600">Net Savings</p>
                  <p className="text-xl font-semibold text-blue-600">{formatCurrency(netSavings)}</p>
                </div>
              </div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Savings Rate</span>
                <span>{savingsRate.toFixed(1)}%</span>
              </div>
              <Progress value={savingsRate} className="h-2" />
              <p className="text-sm text-neutral-500 mt-2">
                You're saving {savingsRate.toFixed(1)}% of your income
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spreadsheet-like Budget Table */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
          <CardDescription>Detailed view of your budget by category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="overflow-auto">
              <Table className="min-w-full border-collapse">
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="w-[300px] font-semibold">Category / Item</TableHead>
                    <TableHead className="text-right font-semibold">
                      {viewMode === 'monthly' ? `${selectedMonth} ${selectedYear}` : `Annual ${selectedYear}`}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetCategories.map((category, categoryIndex) => { 
                    return (
                      <React.Fragment key={category.name}>
                        <TableRow 
                          className={`hover:bg-muted/50 ${isEditMode ? '' : 'cursor-pointer'}`} 
                          onClick={() => !isEditMode && toggleCategory(category.name)}
                        >
                          <TableCell className="font-medium flex items-center gap-2">
                            {category.isExpanded ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4 rotate-[-90deg] transform" />
                            }
                            {category.name}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(viewMode === 'monthly' ? category.monthlyTotal : category.total)}
                          </TableCell>
                        </TableRow>
                        
                        {category.isExpanded && category.items.map((item, itemIndex) => (
                          <TableRow 
                            key={`${category.name}-${itemIndex}`} 
                            className={`text-sm ${
                              editingItem?.categoryIndex === categoryIndex && 
                              editingItem?.itemIndex === itemIndex 
                                ? 'bg-primary/5' 
                                : 'bg-muted/20'
                            } ${
                              !isEditMode ? 'hover:bg-muted/40 cursor-pointer' : ''
                            }`}
                            onClick={() => !isEditMode && handleItemClick(categoryIndex, itemIndex)}
                          >
                            <TableCell className="pl-9">{item.name}</TableCell>
                            <TableCell className="text-right">
                              {editingItem?.categoryIndex === categoryIndex && 
                               editingItem?.itemIndex === itemIndex ? (
                                <div className="flex items-center justify-end space-x-2">
                                  <Input 
                                    ref={editInputRef}
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    className="w-32 text-right"
                                    autoFocus
                                  />
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={saveItemEdit}
                                    >
                                      <Save className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={cancelItemEdit}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end group">
                                  <span className="mr-2">
                                    {formatCurrency(viewMode === 'monthly' ? item.monthly : item.amount)}
                                  </span>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleItemClick(categoryIndex, itemIndex);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Totals row */}
                  <TableRow className="font-semibold bg-muted">
                    <TableCell>Total Income</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalIncome)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-semibold bg-muted">
                    <TableCell>Total Expenses</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalExpenses)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-semibold bg-muted">
                    <TableCell>Net (Income - Expenses)</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(netSavings)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}