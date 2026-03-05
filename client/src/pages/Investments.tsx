import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Investment } from '@shared/schema';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/formatters';

export default function Investments() {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Investment; direction: 'asc' | 'desc' } | null>(null);
  
  const { data: investments, isLoading } = useQuery<Investment[]>({
    queryKey: ['/api/investments'],
    // Force a refetch when visiting the page
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const filteredInvestments = investments ? investments : [];

  const sortedInvestments = [...(filteredInvestments || [])];
  if (sortConfig !== null) {
    sortedInvestments.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  const requestSort = (key: keyof Investment) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Investment) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Investments</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-neutral-100 rounded-lg w-64"></div>
          <div className="h-80 bg-neutral-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const getTotalValue = () => {
    if (!investments) return 0;
    return investments.reduce((sum, inv) => sum + inv.value, 0);
  };

  const getTotalCostBasis = () => {
    if (!investments) return 0;
    return investments.reduce((sum, inv) => sum + inv.costBasis, 0);
  };

  const getTotalGainLoss = () => {
    return getTotalValue() - getTotalCostBasis();
  };

  const getTotalGainLossPercent = () => {
    const costBasis = getTotalCostBasis();
    if (costBasis === 0) return 0;
    return (getTotalGainLoss() / costBasis) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Investments</h1>
        <Button 
          onClick={() => {
            window.history.pushState({}, '', '/investments/new');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="gap-2"
        >
          + Add Investment
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-neutral-500">Total Value</div>
            <div className="text-xl font-bold text-neutral-800">
              {formatCurrency(getTotalValue())}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-neutral-500">Total Cost Basis</div>
            <div className="text-xl font-bold text-neutral-800">
              {formatCurrency(getTotalCostBasis())}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-neutral-500">Total Gain/Loss</div>
            <div className={`text-xl font-bold ${getTotalGainLoss() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {getTotalGainLoss() >= 0 ? '+' : ''}
              {formatCurrency(Math.abs(getTotalGainLoss()))}
              <span className="text-sm ml-1">({formatPercentage(getTotalGainLossPercent())})</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-6">All Investments</h3>
          
          {sortedInvestments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-neutral-500">You don't have any investments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => requestSort('name')} className="cursor-pointer">
                      Asset {getSortIndicator('name')}
                    </TableHead>
                    <TableHead onClick={() => requestSort('type')} className="cursor-pointer">
                      Type {getSortIndicator('type')}
                    </TableHead>
                    <TableHead onClick={() => requestSort('price')} className="cursor-pointer text-right">
                      Price {getSortIndicator('price')}
                    </TableHead>
                    <TableHead onClick={() => requestSort('quantity')} className="cursor-pointer text-right">
                      Quantity {getSortIndicator('quantity')}
                    </TableHead>
                    <TableHead onClick={() => requestSort('value')} className="cursor-pointer text-right">
                      Current Value {getSortIndicator('value')}
                    </TableHead>
                    <TableHead onClick={() => requestSort('costBasis')} className="cursor-pointer text-right">
                      Cost Basis {getSortIndicator('costBasis')}
                    </TableHead>
                    <TableHead onClick={() => requestSort('performancePercent')} className="cursor-pointer text-right">
                      Gain/Loss {getSortIndicator('performancePercent')}
                    </TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvestments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell className="flex items-center">
                        <div 
                          className={`mr-3 bg-${investment.logoColor || 'blue'}-100 text-${investment.logoColor || 'blue'}-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold`}
                        >
                          {investment.logoInitial || investment.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{investment.name}</div>
                          <div className="text-xs text-neutral-500">{investment.symbol}</div>
                        </div>
                      </TableCell>
                      <TableCell>{investment.type}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(investment.price)}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(investment.quantity)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(investment.value)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(investment.costBasis)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={investment.performancePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {investment.performancePercent >= 0 ? '+' : ''}
                          {formatCurrency(investment.performanceValue)}
                          <br />
                          <span className="text-xs">
                            ({investment.performancePercent >= 0 ? '+' : ''}{formatPercentage(investment.performancePercent)})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={investment.performanceHistory.map((val, i) => ({ value: val }))}>
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke={investment.performancePercent >= 0 ? '#10B981' : '#EF4444'} 
                                strokeWidth={1.5}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}