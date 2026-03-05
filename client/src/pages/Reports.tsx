import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Investment, AssetAllocation } from '@/lib/types';

export default function Reports() {
  const [timeframe, setTimeframe] = useState<string>('1M');
  
  const { data: investments } = useQuery<Investment[]>({
    queryKey: ['/api/investments'],
  });
  
  const { data: allocation } = useQuery<AssetAllocation[]>({
    queryKey: ['/api/portfolio/allocation'],
  });
  
  if (!investments || !allocation) {
    return (
      <div className="min-h-screen">
        <Header title="Reports & Analysis" />
        <div className="px-4 sm:px-6 lg:px-8">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6 flex justify-center items-center h-64">
              <p className="text-neutral-500">Loading report data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Prepare data for top performers chart
  const topPerformers = [...investments]
    .sort((a, b) => b.performancePercent - a.performancePercent)
    .slice(0, 5)
    .map(inv => ({
      name: inv.symbol,
      value: inv.performancePercent
    }));
  
  // Prepare data for worst performers chart
  const worstPerformers = [...investments]
    .sort((a, b) => a.performancePercent - b.performancePercent)
    .slice(0, 5)
    .map(inv => ({
      name: inv.symbol,
      value: inv.performancePercent
    }));
  
  // Prepare data for largest holdings chart
  const largestHoldings = [...investments]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(inv => ({
      name: inv.symbol,
      value: inv.value
    }));
  
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen">
      <Header title="Reports & Analysis" />
      
      <div className="px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="performance" className="w-full mb-8">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
            <TabsTrigger value="allocation">Asset Allocation</TabsTrigger>
            <TabsTrigger value="holdings">Holdings Breakdown</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white rounded-xl shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-lg text-neutral-800">Top Performers</h3>
                    <div className="flex space-x-2">
                      {['1M', '3M', '6M', '1Y'].map((tf) => (
                        <Button 
                          key={tf} 
                          variant={timeframe === tf ? "default" : "outline"}
                          size="sm" 
                          className={timeframe === tf ? 'bg-primary-light bg-opacity-10 text-primary' : ''}
                          onClick={() => setTimeframe(tf)}
                        >
                          {tf}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topPerformers}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis 
                          type="number" 
                          tickFormatter={formatPercent}
                          domain={[0, 'dataMax']}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                        />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, 'Performance']} />
                        <Bar dataKey="value" fill="#10B981" barSize={20} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-xl shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-lg text-neutral-800">Worst Performers</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={worstPerformers}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis 
                          type="number" 
                          tickFormatter={formatPercent}
                          domain={['dataMin', 0]}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                        />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, 'Performance']} />
                        <Bar dataKey="value" fill="#EF4444" barSize={20} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="allocation">
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg text-neutral-800">Asset Allocation</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocation}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="percentage"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {allocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value}%`, 'Allocation']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="font-medium text-lg mb-4">Allocation Breakdown</h4>
                    <div className="space-y-3">
                      {allocation.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3" 
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{item.type}</div>
                            <div className="text-sm text-neutral-500">
                              {item.percentage}% of portfolio
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="holdings">
            <Card className="bg-white rounded-xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg text-neutral-800">Largest Holdings</h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={largestHoldings}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Value']} />
                      <Bar dataKey="value" fill="#1E40AF" barSize={40} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium text-lg mb-4">Holdings Breakdown</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="py-2 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Symbol</th>
                          <th className="py-2 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                          <th className="py-2 px-4 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Value</th>
                          <th className="py-2 px-4 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">% of Portfolio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {largestHoldings.map((holding, index) => {
                          const investment = investments.find(inv => inv.symbol === holding.name);
                          const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);
                          const percentage = (holding.value / totalValue) * 100;
                          
                          return (
                            <tr key={index}>
                              <td className="py-2 px-4 text-sm font-medium text-neutral-800">{holding.name}</td>
                              <td className="py-2 px-4 text-sm text-neutral-600">{investment?.name}</td>
                              <td className="py-2 px-4 text-sm text-neutral-800 text-right">{formatCurrency(holding.value)}</td>
                              <td className="py-2 px-4 text-sm text-neutral-800 text-right">{percentage.toFixed(2)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
