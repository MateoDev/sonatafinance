// Investment types
export type AssetType = 'Stock' | 'ETF' | 'Crypto' | 'Bond' | 'Real Estate' | 'Cash' | 'Other';

export interface Investment {
  id: number;
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  quantity: number;
  value: number;
  costBasis: number;
  performancePercent: number;
  performanceValue: number;
  performanceHistory: number[];
  notes?: string;
  logoColor?: string;
  logoInitial?: string;
}

// Activity types
export type ActivityType = 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL';

export interface Activity {
  id: number;
  type: ActivityType;
  investmentId?: number;
  investmentName?: string;
  date: string;
  amount: number;
  quantity?: number;
  price?: number;
  description: string;
}

// Portfolio summary types
export interface PortfolioSummary {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  monthlyChange: number;
  monthlyChangePercent: number;
}

// Asset allocation types
export interface AssetAllocation {
  type: string;
  percentage: number;
  color: string;
}

// Performance history types
export interface PerformanceHistoryEntry {
  date: string;
  value: number;
}

export interface PerformanceHistory {
  data: PerformanceHistoryEntry[];
  timeframe: '1M' | '3M' | '6M' | '1Y' | 'ALL';
}

// Processed data types for natural language and spreadsheet inputs
export type ProcessedFinancialData = {
  type: 'investment' | 'expense' | 'liability' | 'payment' | 'goal';
  items: any[]; // Will be structured based on schema
  summary: string;
  confidence: number;
};

// Global types
export type Timeframe = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export type SelectItem = {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
  selected?: boolean;
};

// Extend the Window interface to include Firebase
declare global {
  interface Window {
    firebase?: {
      auth: () => {
        signOut: () => Promise<void>;
      };
    };
  }
}
