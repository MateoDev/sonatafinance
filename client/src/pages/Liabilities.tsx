import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface Liability {
  id: number;
  name: string;
  type: string;
  amount: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: number;
}

export default function Liabilities() {
  
  const { data: liabilities, isLoading } = useQuery<Liability[]>({
    queryKey: ["/api/liabilities"],
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Liabilities</h1>
        <Button 
          onClick={() => {
            window.history.pushState({}, '', '/liabilities/new');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" /> Add Liability
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Liabilities Summary</CardTitle>
          <CardDescription>Overview of your total debt</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600">Total Debt</p>
                <p className="text-xl font-semibold">{formatCurrency(25401.63)}</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600">Monthly Payments</p>
                <p className="text-xl font-semibold">{formatCurrency(1000)}</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-600">Available for Repayment</p>
                <p className="text-xl font-semibold">{formatCurrency(1800)}</p>
                <Badge className="bg-green-500 mt-1">Extra: {formatCurrency(800)}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liabilities List */}
      <Card>
        <CardHeader>
          <CardTitle>Liabilities List</CardTitle>
          <CardDescription>Details of your current debts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-auto">
                <table className="w-full mb-4">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="p-3 text-left">Creditor</th>
                      <th className="p-3 text-right">Balance</th>
                      <th className="p-3 text-right">Interest Rate</th>
                      <th className="p-3 text-right">Monthly Payment</th>
                      <th className="p-3 text-right">% of Total</th>
                      <th className="p-3 text-right">Payment Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liabilities && liabilities.length > 0 ? (
                      <>
                        {liabilities.map((liability) => (
                          <tr key={liability.id} className="border-b">
                            <td className="p-3">{liability.name}</td>
                            <td className="p-3 text-right">{formatCurrency(liability.amount)}</td>
                            <td className="p-3 text-right">{liability.interestRate ? `${liability.interestRate}%` : '-'}</td>
                            <td className="p-3 text-right">{formatCurrency(liability.minimumPayment)}</td>
                            <td className="p-3 text-right">
                              {/* Calculate percentage of total if we have total */}
                              {liabilities.reduce((sum, l) => sum + l.amount, 0) > 0
                                ? formatPercentage(liability.amount / liabilities.reduce((sum, l) => sum + l.amount, 0))
                                : '-'}
                            </td>
                            <td className="p-3 text-right">{liability.dueDate ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                        <tr className="bg-neutral-50 font-semibold">
                          <td className="p-3">Total</td>
                          <td className="p-3 text-right">
                            {formatCurrency(liabilities.reduce((sum, liability) => sum + liability.amount, 0))}
                          </td>
                          <td className="p-3 text-right">
                            {/* Calculate average interest rate */}
                            {liabilities.some(l => l.interestRate)
                              ? `${(liabilities.reduce((sum, l) => sum + (l.interestRate || 0), 0) / 
                                  liabilities.filter(l => l.interestRate).length).toFixed(2)}%`
                              : '-'}
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrency(liabilities.reduce((sum, liability) => sum + (liability.minimumPayment || 0), 0))}
                          </td>
                          <td className="p-3 text-right">100.00%</td>
                          <td className="p-3 text-right"></td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-500">
                          No liabilities found. Add your first liability by clicking the "Add Liability" button.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Budgeted Amount</CardTitle>
                  <CardDescription>Enter the amount you have available in your budget each month for debt repayment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-lg">
                      <p className="text-sm text-neutral-600">Repayment Budget</p>
                      <p className="text-xl font-semibold">{formatCurrency(1800)}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-neutral-600">Payment Goal Q2 2025</p>
                      <p className="text-xl font-semibold">{formatCurrency(0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Totals & Summary</CardTitle>
                  <CardDescription>A calculated summary of your total debts and what you have available to pay them back</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">Total Debt</p>
                        <p className="text-xl font-semibold">{formatCurrency(25401.63)}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">Total Credit Debt</p>
                        <p className="text-xl font-semibold">{formatCurrency(0)}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">Total Personal Debt</p>
                        <p className="text-xl font-semibold">{formatCurrency(0)}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">Total Loan Debt</p>
                        <p className="text-xl font-semibold">{formatCurrency(4763)}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">Average Interest Rate</p>
                        <p className="text-md font-semibold">0.83%</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">Average Monthly Interest</p>
                        <p className="text-md font-semibold">{formatCurrency(17.46)}</p>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">Total Monthly Payments</p>
                        <p className="text-xl font-semibold">{formatCurrency(1000)}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">Amount Available</p>
                        <p className="text-xl font-semibold">{formatCurrency(1800)}</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-neutral-600">Extra Repayments</p>
                        <p className="text-xl font-semibold text-green-600">{formatCurrency(800)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Repayment Strategies</CardTitle>
                  <CardDescription>Pick your debt to repay. Either pay off the debt with the highest interest rate, or the one with the smallest balance.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="text-md font-semibold mb-3">Highest Interest Rate First:</h3>
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="p-2 text-left">Creditor</th>
                          <th className="p-2 text-right">Balance</th>
                          <th className="p-2 text-right">Interest Rate</th>
                          <th className="p-2 text-right">Monthly Payment</th>
                          <th className="p-2 text-right">New Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">Nelnet</td>
                          <td className="p-2 text-right">{formatCurrency(4763)}</td>
                          <td className="p-2 text-right">4.40%</td>
                          <td className="p-2 text-right">{formatCurrency(0)}</td>
                          <td className="p-2 text-right text-green-600">{formatCurrency(800)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-semibold mb-3">Lowest Balance First:</h3>
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="p-2 text-left">Creditor</th>
                          <th className="p-2 text-right">Balance</th>
                          <th className="p-2 text-right">Interest Rate</th>
                          <th className="p-2 text-right">Monthly Payment</th>
                          <th className="p-2 text-right">New Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">Parents</td>
                          <td className="p-2 text-right">{formatCurrency(12384.63)}</td>
                          <td className="p-2 text-right">0.00%</td>
                          <td className="p-2 text-right">{formatCurrency(1000)}</td>
                          <td className="p-2 text-right text-green-600">{formatCurrency(1800)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}