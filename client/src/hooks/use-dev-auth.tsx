import { createContext, ReactNode, useContext, useState } from "react";
import { User, Investment, Activity } from "@shared/schema";

// Mock user for development purposes
const MOCK_USER: User = {
  id: 999,
  username: "dev_user",
  name: "Development User",
  email: "dev@example.com",
  createdAt: new Date(),
  password: "" // This is needed for the type but will never be exposed to the frontend
};

// Mock investments based on the Excel data - using types from schema
const MOCK_INVESTMENTS: Partial<Investment>[] = [
  {
    id: 1,
    userId: 999,
    name: "Apple Inc.",
    symbol: "AAPL",
    type: "Stock",
    price: "179.66",
    quantity: "15",
    value: "2694.90",
    costBasis: "2250.00",
    purchaseDate: "2023-01-15",
    performanceValue: 444.90,
    performancePercent: 19.77,
    performanceHistory: [5, 7, 10, 8, 12, 15, 13, 16, 19, 20],
    logoColor: "blue",
    logoInitial: "A"
  },
  {
    id: 2,
    userId: 999,
    name: "Microsoft Corp",
    symbol: "MSFT",
    type: "Stock",
    price: "417.88",
    quantity: "10",
    value: "4178.80",
    costBasis: "3400.00",
    purchaseDate: "2023-02-20",
    performanceValue: 778.80,
    performancePercent: 22.91,
    performanceHistory: [3, 5, 8, 10, 7, 9, 12, 15, 18, 22],
    logoColor: "green",
    logoInitial: "M"
  },
  {
    id: 3,
    userId: 999,
    name: "Vanguard S&P 500 ETF",
    symbol: "VOO",
    type: "ETF",
    price: "470.29",
    quantity: "8",
    value: "3762.32",
    costBasis: "3200.00",
    purchaseDate: "2023-03-10",
    performanceValue: 562.32,
    performancePercent: 17.57,
    performanceHistory: [2, 4, 3, 5, 8, 10, 9, 13, 15, 17],
    logoColor: "red",
    logoInitial: "V"
  },
  {
    id: 4,
    userId: 999,
    name: "Tesla Inc.",
    symbol: "TSLA",
    type: "Stock",
    price: "175.34",
    quantity: "12",
    value: "2104.08",
    costBasis: "2400.00",
    purchaseDate: "2023-04-05",
    performanceValue: -295.92,
    performancePercent: -12.33,
    performanceHistory: [10, 8, 6, 4, 3, 5, 3, 2, 0, -2],
    logoColor: "purple",
    logoInitial: "T"
  },
  {
    id: 5,
    userId: 999,
    name: "Bitcoin",
    symbol: "BTC",
    type: "Crypto",
    price: "64352.18",
    quantity: "0.2",
    value: "12870.44",
    costBasis: "10000.00",
    purchaseDate: "2023-05-12",
    performanceValue: 2870.44,
    performancePercent: 28.70,
    performanceHistory: [5, 10, 15, 20, 15, 25, 20, 30, 25, 28],
    logoColor: "orange",
    logoInitial: "B"
  }
] as Investment[];

// Mock activities for the dashboard - using types from schema
const MOCK_ACTIVITIES: Partial<Activity>[] = [
  {
    id: 1,
    userId: 999,
    type: "BUY",
    assetName: "Apple Inc.",
    assetSymbol: "AAPL",
    amount: "2250.00",
    quantity: "15",
    date: new Date("2023-01-15T10:30:00Z"),
    price: "150.00"
  },
  {
    id: 2,
    userId: 999,
    type: "BUY",
    assetName: "Microsoft Corp",
    assetSymbol: "MSFT",
    amount: "3400.00",
    quantity: "10",
    date: new Date("2023-02-20T14:45:00Z"),
    price: "340.00"
  },
  {
    id: 3,
    userId: 999,
    type: "BUY",
    assetName: "Vanguard S&P 500 ETF",
    assetSymbol: "VOO",
    amount: "3200.00",
    quantity: "8",
    date: new Date("2023-03-10T09:15:00Z"),
    price: "400.00"
  },
  {
    id: 4,
    userId: 999,
    type: "BUY",
    assetName: "Tesla Inc.",
    assetSymbol: "TSLA",
    amount: "2400.00",
    quantity: "12",
    date: new Date("2023-04-05T11:20:00Z"),
    price: "200.00"
  },
  {
    id: 5,
    userId: 999,
    type: "BUY",
    assetName: "Bitcoin",
    assetSymbol: "BTC",
    amount: "10000.00",
    quantity: "0.2",
    date: new Date("2023-05-12T16:00:00Z"),
    price: "50000.00"
  },
  {
    id: 6,
    userId: 999,
    type: "DIVIDEND",
    assetName: "Microsoft Corp",
    assetSymbol: "MSFT",
    amount: "45.00",
    quantity: "0",
    date: new Date("2023-06-15T08:30:00Z"),
    price: "0"
  }
] as Activity[];

// Create mock asset allocation data
const MOCK_ALLOCATION = [
  { type: "Stocks", percentage: 60, color: "#4f46e5" },
  { type: "ETF", percentage: 15, color: "#10b981" },
  { type: "Cryptocurrency", percentage: 25, color: "#f59e0b" }
];

// Create mock performance history data
const MOCK_PERFORMANCE = {
  data: [
    { date: "2024-03-01", value: 22300 },
    { date: "2024-03-08", value: 23100 },
    { date: "2024-03-15", value: 22900 },
    { date: "2024-03-22", value: 23500 },
    { date: "2024-03-29", value: 24200 },
    { date: "2024-04-05", value: 24800 },
    { date: "2024-04-12", value: 25100 },
    { date: "2024-04-19", value: 25600 }
  ],
  timeframe: "1M"
};

// Create mock portfolio summary
const MOCK_SUMMARY = {
  totalValue: 25610.54,
  totalGain: 4360.54,
  totalGainPercent: 20.53,
  dayChange: 412.50,
  dayChangePercent: 1.64,
  monthlyChange: 3300.54,
  monthlyChangePercent: 14.78
};

// Create mock notes data
const MOCK_NOTES = [
  {
    id: 1,
    userId: 999,
    title: "Monthly Budget Review",
    content: "# April 2025 Budget Review\n\n## Overview\nNeed to review and adjust the monthly budget for groceries and utilities.\n\n## Adjustments\n- Reduce entertainment budget by $50\n- Increase grocery budget by $30\n- Increase utilities by $20\n\n## Action Items\n- [ ] Update budget spreadsheet\n- [ ] Review subscriptions for possible cancellations\n- [ ] Set up automatic transfer for savings",
    category: "Budget",
    folder: "Finances/Budgeting",
    recordDate: new Date("2025-04-15"),
    tags: ["budget", "review", "planning"],
    isPinned: false,
    createdAt: new Date("2025-04-15"),
    updatedAt: new Date("2025-04-15")
  },
  {
    id: 2,
    userId: 999,
    title: "Investment Portfolio Strategy",
    content: "# Investment Strategy 2025\n\n## Current Allocation\n| Category | Current % | Target % |\n|----------|-----------|----------|\n| US Stocks | 45% | 40% |\n| Int'l Stocks | 25% | 30% |\n| Bonds | 20% | 20% |\n| Alternatives | 10% | 10% |\n\n## Research Areas\n- Tech sector rotation strategy\n- Increasing allocation to index funds\n- Small cap value tilt\n\n## Next Steps\n1. Schedule meeting with financial advisor\n2. Research ETFs with lower expense ratios\n3. Consider tax-loss harvesting opportunities",
    category: "Investment",
    folder: "Finances/Investments",
    recordDate: new Date("2025-04-10"),
    tags: ["investments", "planning", "stocks", "strategy"],
    isPinned: true,
    createdAt: new Date("2025-04-10"),
    updatedAt: new Date("2025-04-10")
  },
  {
    id: 3,
    userId: 999,
    title: "Mortgage Refinance Options",
    content: "# Mortgage Refinance Research\n\n## Current Loan\n- Rate: **4.2%**\n- Term: 30 years (25 years remaining)\n- Principal: $320,000\n- Monthly payment: $1,568\n\n## Refinance Options\n\n### Option 1: 15-Year Fixed\n- Rate: ~3.1%\n- Monthly payment: ~$2,220\n- Total interest savings: $98,000\n\n### Option 2: 20-Year Fixed\n- Rate: ~3.4%\n- Monthly payment: ~$1,830\n- Total interest savings: $62,000\n\n### Option 3: 30-Year Fixed\n- Rate: ~3.5%\n- Monthly payment: ~$1,430\n- Total interest savings: $51,000\n\n## Lenders to Check\n- [ ] Quicken Loans\n- [ ] Bank of America\n- [ ] Local Credit Union\n- [ ] Better.com",
    category: "Liability",
    folder: "Finances/Loans",
    recordDate: new Date("2025-03-28"),
    tags: ["mortgage", "refinance", "research", "loans"],
    isPinned: false,
    createdAt: new Date("2025-03-28"),
    updatedAt: new Date("2025-03-28")
  },
  {
    id: 4,
    userId: 999,
    title: "Tax Planning Strategies",
    content: "# 2025 Tax Planning\n\n## Deduction Opportunities\n- Home office deduction\n- Charitable contributions\n- IRA contributions\n- HSA contributions\n\n## Credits to Consider\n- Child tax credit\n- Electric vehicle credit\n- Education credits\n\n## Questions for Accountant\n1. Benefits of bunching deductions?\n2. Roth conversion opportunities?\n3. Tax-loss harvesting recommendations?\n\n```\nIncome projection for 2025:\n- Salary: $120,000\n- Bonuses: $15,000 (estimate)\n- Dividends: $3,000\n- Capital gains: TBD\n```",
    category: "General",
    folder: "Finances/Taxes",
    recordDate: new Date("2025-04-05"),
    tags: ["taxes", "planning", "deductions", "2025"],
    isPinned: true,
    createdAt: new Date("2025-04-05"),
    updatedAt: new Date("2025-04-05")
  },
  {
    id: 5,
    userId: 999,
    title: "Retirement Planning Checklist",
    content: "# Retirement Planning\n\n## Current Status\n- 401(k): $250,000\n- Roth IRA: $85,000\n- Taxable accounts: $120,000\n\n## Annual Contributions\n- 401(k): $22,500 + $7,500 employer match\n- Roth IRA: $6,500\n- Taxable investments: $12,000\n\n## Next Actions\n- [ ] Increase 401(k) contribution by 2% after promotion\n- [ ] Research Roth conversion options\n- [ ] Review portfolio allocation\n- [ ] Update retirement calculators with new assumptions\n- [ ] Check if on track for retirement age 60\n\n![Retirement Projection](https://example.com/chart-placeholder)",
    category: "Goal",
    folder: "Planning/Retirement",
    recordDate: new Date("2025-04-02"),
    tags: ["retirement", "401k", "investment", "planning", "goals"],
    isPinned: false,
    createdAt: new Date("2025-04-02"),
    updatedAt: new Date("2025-04-07")
  }
];

// Create mock financial goals data
const MOCK_GOALS = [
  {
    id: 1,
    userId: 999,
    name: "Emergency Fund",
    type: "Savings",
    targetAmount: "10000.00",
    currentAmount: "7500.00",
    startDate: new Date("2023-11-01"),
    targetDate: new Date("2024-12-31"),
    isCompleted: false,
    completedDate: null,
    color: "#4f46e5",
    icon: "Shield",
    notes: "Three month emergency fund based on current expenses",
    createdAt: new Date("2023-11-01"),
    updatedAt: new Date("2023-11-01")
  },
  {
    id: 2,
    userId: 999,
    name: "New Car Down Payment",
    type: "Purchase",
    targetAmount: "15000.00",
    currentAmount: "3500.00",
    startDate: new Date("2023-12-01"),
    targetDate: new Date("2025-06-30"),
    isCompleted: false,
    completedDate: null,
    color: "#10b981",
    icon: "Car",
    notes: "Saving for 20% down payment on a new EV",
    createdAt: new Date("2023-12-01"),
    updatedAt: new Date("2023-12-01")
  },
  {
    id: 3,
    userId: 999,
    name: "Retirement Fund",
    type: "Retirement",
    targetAmount: "1000000.00",
    currentAmount: "250000.00",
    startDate: new Date("2020-01-01"),
    targetDate: new Date("2055-01-01"),
    isCompleted: false,
    completedDate: null,
    color: "#f59e0b",
    icon: "TrendingUp",
    notes: "Long-term retirement savings",
    createdAt: new Date("2020-01-01"),
    updatedAt: new Date("2024-01-15")
  }
];

type DevAuthContextType = {
  enableDevBypass: boolean;
  toggleDevBypass: () => void;
  mockUser: User | null;
  mockInvestments: Investment[];
  mockActivities: Activity[];
  mockAllocation: any[];
  mockPerformance: any;
  mockSummary: any;
  mockGoals: any[];
  mockNotes: any[];
};

const DevAuthContext = createContext<DevAuthContextType | null>(null);

/**
 * Development-only authentication provider that allows bypassing real authentication
 * This should be removed in production
 */
export function DevAuthProvider({ children }: { children: ReactNode }) {
  // Check if we're on the live site (replit.app domain)
  const isProductionSite = window.location.hostname.includes('.replit.app');
  
  // Force dev mode off in production, allow toggle only in development environments
  const [enableDevBypass, setEnableDevBypass] = useState(false);
  
  
  const toggleDevBypass = () => {
    // Only allow toggling in development environment, not on the deployed site
    if (!isProductionSite) {
      setEnableDevBypass(prev => !prev);
    }
  };
  
  // Make dev auth context available in the window object for the queryClient
  const contextValue = {
    enableDevBypass,
    toggleDevBypass,
    mockUser: enableDevBypass ? MOCK_USER : null,
    mockInvestments: MOCK_INVESTMENTS,
    mockActivities: MOCK_ACTIVITIES,
    mockAllocation: MOCK_ALLOCATION,
    mockPerformance: MOCK_PERFORMANCE,
    mockSummary: MOCK_SUMMARY,
    mockGoals: MOCK_GOALS,
    mockNotes: MOCK_NOTES
  };
  
  // @ts-ignore - Add to window for dev purposes
  window.devAuth = contextValue;

  return (
    <DevAuthContext.Provider
      value={{
        enableDevBypass,
        toggleDevBypass,
        mockUser: enableDevBypass ? MOCK_USER : null,
        mockInvestments: MOCK_INVESTMENTS,
        mockActivities: MOCK_ACTIVITIES,
        mockAllocation: MOCK_ALLOCATION,
        mockPerformance: MOCK_PERFORMANCE,
        mockSummary: MOCK_SUMMARY,
        mockGoals: MOCK_GOALS,
        mockNotes: MOCK_NOTES
      }}
    >
      {children}
    </DevAuthContext.Provider>
  );
}

/**
 * Hook for accessing development authentication bypass
 * This should be removed in production
 */
export function useDevAuth() {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error("useDevAuth must be used within a DevAuthProvider");
  }
  return context;
}