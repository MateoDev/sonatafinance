import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function PortfolioSummary() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['/api/portfolio/summary'],
    // Don't refetch automatically as often to improve performance
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6 h-24 flex items-center justify-center">
              <div className="animate-pulse w-full">
                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-neutral-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!summary) {
    return (
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm text-center">
        <p className="text-neutral-500">Portfolio summary data is unavailable</p>
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white rounded-xl shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-6 flex flex-col">
          <div className="text-neutral-500 text-sm font-medium mb-2">Total Portfolio Value</div>
          <div className="text-3xl font-bold text-neutral-800">
            ${summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-2">
            <span className={`inline-flex items-center font-medium ${summary.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="material-icons text-sm mr-1">
                {summary.dayChangePercent >= 0 ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <span>{Math.abs(summary.dayChangePercent).toFixed(2)}%</span>
            </span>
            <span className="text-neutral-500 text-sm ml-2">Today</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white rounded-xl shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-6 flex flex-col">
          <div className="text-neutral-500 text-sm font-medium mb-2">Total Gain/Loss</div>
          <div className={`text-3xl font-bold ${summary.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.totalGain >= 0 ? '+' : ''}${Math.abs(summary.totalGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-2">
            <span className={`inline-flex items-center font-medium ${summary.totalGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="material-icons text-sm mr-1">
                {summary.totalGainPercent >= 0 ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <span>{Math.abs(summary.totalGainPercent).toFixed(2)}%</span>
            </span>
            <span className="text-neutral-500 text-sm ml-2">All time</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white rounded-xl shadow-sm hover:shadow transition-shadow">
        <CardContent className="p-6 flex flex-col">
          <div className="text-neutral-500 text-sm font-medium mb-2">Monthly Performance</div>
          <div className={`text-3xl font-bold ${summary.monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.monthlyChange >= 0 ? '+' : ''}${Math.abs(summary.monthlyChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-2">
            <span className={`inline-flex items-center font-medium ${summary.monthlyChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="material-icons text-sm mr-1">
                {summary.monthlyChangePercent >= 0 ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <span>{Math.abs(summary.monthlyChangePercent).toFixed(2)}%</span>
            </span>
            <span className="text-neutral-500 text-sm ml-2">This month</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
