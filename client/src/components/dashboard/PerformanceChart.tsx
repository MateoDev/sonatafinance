import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PerformanceHistory } from '@/lib/types';

export default function PerformanceChart() {
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('1M');
  
  const { data, isLoading } = useQuery<PerformanceHistory>({
    queryKey: ['/api/portfolio/performance', timeframe],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/portfolio/performance?timeframe=${queryKey[1]}`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      return response.json();
    },
    // Force refresh when component mounts or window focuses
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-neutral-800">Performance History</h3>
            <div className="flex space-x-2">
              {['1M', '3M', '6M', '1Y'].map((tf) => (
                <Button 
                  key={tf} 
                  variant="ghost" 
                  size="sm" 
                  className="px-3 py-1"
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
            <div className="animate-pulse text-neutral-400">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-neutral-800">Performance History</h3>
          </div>
          <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
            <p className="text-neutral-500">Performance data is unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg text-neutral-800">Performance History</h3>
          <div className="flex space-x-2">
            {(['1M', '3M', '6M', '1Y'] as const).map((tf) => (
              <Button 
                key={tf} 
                variant={timeframe === tf ? "default" : "outline"}
                size="sm" 
                className={`px-3 py-1 ${timeframe === tf ? 'bg-primary-light bg-opacity-10 text-primary' : 'text-neutral-600 hover:bg-neutral-100'}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#1E40AF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px', 
                  padding: '12px' 
                }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#fff', fontWeight: 600 }}
                formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#1E40AF" 
                strokeWidth={2}
                fill="url(#colorValue)" 
                activeDot={{ r: 6, fill: '#1E40AF', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
