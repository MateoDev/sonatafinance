import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Define types for market data
interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Define static data for fallback
const FALLBACK_DATA: TickerItem[] = [
  { symbol: 'SPY', price: 510.32, change: 2.15, changePercent: 0.42 },
  { symbol: 'DIA', price: 386.78, change: -1.21, changePercent: -0.34 },
  { symbol: 'BTC', price: 67842.11, change: 423.56, changePercent: 0.62 },
  { symbol: 'ETH', price: 3175.24, change: 29.56, changePercent: 0.94 },
];

export function MarketTicker() {
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch market data
  useEffect(() => {
    async function fetchMarketData() {
      try {
        // Fetch data from our API endpoint
        const response = await fetch('/api/market-data');
        if (!response.ok) {
          throw new Error('Failed to fetch market data');
        }
        const data = await response.json();
        
        // Use the data if it's not empty, otherwise fallback
        if (data && data.length > 0) {
          setTickerData(data);
        } else {
          throw new Error('Empty market data');
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        // Use fallback data
        setTickerData(FALLBACK_DATA);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarketData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-3 animate-pulse">
        <div className="h-2 w-12 bg-neutral-200 rounded"></div>
        <div className="h-2 w-16 bg-neutral-200 rounded"></div>
        <div className="h-2 w-14 bg-neutral-200 rounded"></div>
        <div className="h-2 w-10 bg-neutral-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="ticker-container w-full">
      <div className="ticker-content">
        {tickerData.map((item, index) => {
          // Simplify crypto symbols: BTC-USD to BTC, ETH-USD to ETH
          const displaySymbol = item.symbol === 'BTC-USD' ? 'BTC' : 
                                item.symbol === 'ETH-USD' ? 'ETH' : 
                                item.symbol;
          
          return (
            <div key={index} className="inline-flex items-center">
              <span className="font-medium text-sm text-neutral-700">{displaySymbol}</span>
              <span className="mx-1 text-sm text-neutral-600">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`flex items-center text-xs ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.change >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                )}
                {Math.abs(item.changePercent).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}