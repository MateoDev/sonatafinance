import { 
  investments, 
  activities,
  users,
  budgetItems,
  liabilities,
  payments,
  financialGoals,
  financialNotes,
  chatMessages,
  type Investment, 
  type InsertInvestment,
  type Activity, 
  type InsertActivity,
  type User,
  type InsertUser,
  type BudgetItem,
  type InsertBudgetItem,
  type Liability,
  type InsertLiability,
  type Payment,
  type InsertPayment,
  type FinancialGoal,
  type InsertFinancialGoal,
  type FinancialNote,
  type InsertFinancialNote,
  type ChatMessage,
  type InsertChatMessage,
  goalTypes,
  activityTypes,
  expenseCategories,
  liabilityTypes,
  noteCategories,
  chatMessageRoles
} from "@shared/schema";

import { generatePerformanceData } from "./helpers";

// Performance history and asset allocation interfaces
export interface PerformanceHistoryEntry {
  date: string;
  value: number;
}

export interface PerformanceHistory {
  data: PerformanceHistoryEntry[];
  timeframe: '1M' | '3M' | '6M' | '1Y' | 'ALL';
}

export interface AssetAllocation {
  type: string;
  percentage: number;
  color: string;
}

export interface RebalanceSuggestion {
  type: string;
  currentAllocation: number;
  targetAllocation: number;
  currentValue: number;
  targetValue: number;
  valueDifference: number;
  action: 'buy' | 'sell' | 'hold';
  color: string;
}

export interface PortfolioRebalance {
  totalPortfolioValue: number;
  suggestions: RebalanceSuggestion[];
  riskProfile: 'conservative' | 'balanced' | 'growth' | 'aggressive' | 'custom';
}

export interface PortfolioSummary {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  monthlyChange: number;
  monthlyChangePercent: number;
}

import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, asc, and } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPgSimple(session);

// Storage interface
export interface IStorage {
  // Session store for auth persistence
  sessionStore: session.Store;
  
  // User authentication methods
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByResetToken(resetToken: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(userId: number): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  updateUserFirebaseInfo(userId: number, firebaseUid: string, emailVerified: boolean, profileImage: string | null): Promise<void>;
  updateUserResetToken(userId: number, resetToken: string, expiryDate: Date): Promise<void>;
  clearUserResetToken(userId: number): Promise<void>;
  updateUser(userId: number, updates: {name?: string, email?: string, profileImage?: string}): Promise<User | undefined>;
  
  // Investment methods
  getInvestment(id: number): Promise<Investment | undefined>;
  getAllInvestments(userId?: number): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: number, investment: InsertInvestment): Promise<Investment>;
  deleteInvestment(id: number): Promise<void>;
  
  // Activity methods
  getActivity(id: number): Promise<Activity | undefined>;
  getAllActivities(userId?: number): Promise<Activity[]>;
  getRecentActivities(limit: number, userId?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Budget methods
  getBudgetItem(id: number): Promise<BudgetItem | undefined>;
  getAllBudgetItems(userId: number): Promise<BudgetItem[]>;
  getBudgetItemsByCategory(userId: number, category: string): Promise<BudgetItem[]>;
  createBudgetItem(budgetItem: InsertBudgetItem): Promise<BudgetItem>;
  updateBudgetItem(id: number, budgetItem: InsertBudgetItem): Promise<BudgetItem>;
  deleteBudgetItem(id: number): Promise<void>;
  
  // Liability methods
  getLiability(id: number): Promise<Liability | undefined>;
  getAllLiabilities(userId: number): Promise<Liability[]>;
  getLiabilitiesByType(userId: number, type: string): Promise<Liability[]>;
  createLiability(liability: InsertLiability): Promise<Liability>;
  updateLiability(id: number, liability: InsertLiability): Promise<Liability>;
  deleteLiability(id: number): Promise<void>;
  
  // Payment methods
  getPayment(id: number): Promise<Payment | undefined>;
  getAllPayments(userId: number): Promise<Payment[]>;
  getUpcomingPayments(userId: number, days: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: InsertPayment): Promise<Payment>;
  deletePayment(id: number): Promise<void>;
  
  // Financial Goal methods
  getFinancialGoal(id: number): Promise<FinancialGoal | undefined>;
  getAllFinancialGoals(userId: number): Promise<FinancialGoal[]>;
  getFinancialGoalsByType(userId: number, type: string): Promise<FinancialGoal[]>;
  createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(id: number, goal: Partial<InsertFinancialGoal>): Promise<FinancialGoal>;
  updateGoalProgress(id: number, currentAmount: number): Promise<FinancialGoal>;
  completeGoal(id: number): Promise<FinancialGoal>;
  deleteFinancialGoal(id: number): Promise<void>;
  
  // Financial Notes methods
  getFinancialNote(id: number): Promise<FinancialNote | undefined>;
  getAllFinancialNotes(userId: number): Promise<FinancialNote[]>;
  getFinancialNotesByCategory(userId: number, category: string): Promise<FinancialNote[]>;
  createFinancialNote(note: InsertFinancialNote): Promise<FinancialNote>;
  updateFinancialNote(id: number, note: Partial<InsertFinancialNote>): Promise<FinancialNote>;
  deleteFinancialNote(id: number): Promise<void>;
  
  // Portfolio analysis methods
  getPortfolioSummary(userId?: number): Promise<PortfolioSummary>;
  getAssetAllocation(userId?: number): Promise<AssetAllocation[]>;
  getPerformanceHistory(timeframe: string, userId?: number): Promise<PerformanceHistory>;
  getPortfolioRebalance(userId?: number, riskProfile?: 'conservative' | 'balanced' | 'growth' | 'aggressive' | 'custom'): Promise<PortfolioRebalance>;
  
  // Chat message methods
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  getChatMessagesByConversation(userId: number, conversationId: string): Promise<ChatMessage[]>;
  getAllUserConversations(userId: number): Promise<{ conversationId: string, lastMessage: string, lastUpdated: Date }[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

const assetTypes = ['Stock', 'ETF', 'Bond', 'Crypto', 'Real Estate', 'Cash', 'Other'];

const assetColors: Record<string, string> = {
  'Stock': '#1E40AF',    // primary blue
  'ETF': '#0EA5E9',      // secondary blue
  'Bond': '#6366F1',     // indigo
  'Crypto': '#6D28D9',   // purple
  'Real Estate': '#D946EF', // pink
  'Cash': '#10B981',     // green
  'Other': '#6B7280'     // gray
};

// Target allocations by risk profile (percentages)
const targetAllocations: Record<string, Record<string, number>> = {
  conservative: {
    'Stock': 20,
    'ETF': 15,
    'Bond': 40,
    'Crypto': 0,
    'Real Estate': 10,
    'Cash': 15,
    'Other': 0
  },
  balanced: {
    'Stock': 30,
    'ETF': 25,
    'Bond': 25,
    'Crypto': 5,
    'Real Estate': 10,
    'Cash': 5,
    'Other': 0
  },
  growth: {
    'Stock': 45,
    'ETF': 25,
    'Bond': 15,
    'Crypto': 7,
    'Real Estate': 5,
    'Cash': 3,
    'Other': 0
  },
  aggressive: {
    'Stock': 55,
    'ETF': 20,
    'Bond': 5,
    'Crypto': 15,
    'Real Estate': 3,
    'Cash': 2,
    'Other': 0
  },
  custom: {
    'Stock': 0,
    'ETF': 0,
    'Bond': 0,
    'Crypto': 0,
    'Real Estate': 0,
    'Cash': 0,
    'Other': 0
  }
};

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private investments: Map<number, Investment>;
  private activities: Map<number, Activity>;
  private budgetItems: Map<number, BudgetItem>;
  private liabilities: Map<number, Liability>;
  private payments: Map<number, Payment>;
  private financialGoals: Map<number, FinancialGoal>;
  private financialNotes: Map<number, FinancialNote>;
  
  public sessionStore: session.Store;
  
  private userIdCounter: number;
  private investmentIdCounter: number;
  private activityIdCounter: number;
  private budgetItemIdCounter: number;
  private liabilityIdCounter: number;
  private paymentIdCounter: number;
  private financialGoalIdCounter: number;
  private financialNoteIdCounter: number;

  constructor() {
    this.users = new Map();
    this.investments = new Map();
    this.activities = new Map();
    this.budgetItems = new Map();
    this.liabilities = new Map();
    this.payments = new Map();
    this.financialGoals = new Map();
    this.financialNotes = new Map();
    
    // Create in-memory session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.userIdCounter = 1;
    this.investmentIdCounter = 1;
    this.activityIdCounter = 1;
    this.budgetItemIdCounter = 1;
    this.liabilityIdCounter = 1;
    this.paymentIdCounter = 1;
    this.financialGoalIdCounter = 1;
    this.financialNoteIdCounter = 1;
    
    // Only initialize demo data if explicitly requested via environment variable or option
    // Demo data should not appear for regular users
    // this.initializeDemoData();
  }
  
  // User authentication methods
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }
  
  async getUserByResetToken(resetToken: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.resetToken === resetToken);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const newUser: User = {
      id,
      ...user,
      createdAt: now,
      updatedAt: now,
      emailVerified: false,
      lastLogin: null,
      resetToken: null,
      resetTokenExpiry: null,
      firebaseUid: null
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUserLastLogin(userId: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      user.password = hashedPassword;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }
  
  async updateUserResetToken(userId: number, resetToken: string, expiryDate: Date): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      user.resetToken = resetToken;
      user.resetTokenExpiry = expiryDate;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }
  
  async clearUserResetToken(userId: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      user.resetToken = null;
      user.resetTokenExpiry = null;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }
  
  async updateUserFirebaseInfo(
    userId: number, 
    firebaseUid: string, 
    emailVerified: boolean = false,
    profileImage: string | null = null
  ): Promise<void> {
    const user = await this.getUserById(userId);
    if (user) {
      user.firebaseUid = firebaseUid;
      user.emailVerified = emailVerified;
      user.updatedAt = new Date();
      
      // Only update profile image if provided
      if (profileImage) {
        user.profileImage = profileImage;
      }
      
      this.users.set(userId, user);
    }
  }
  
  async updateUser(
    userId: number, 
    updates: {name?: string, email?: string, profileImage?: string}
  ): Promise<User | undefined> {
    const user = await this.getUserById(userId);
    if (!user) {
      return undefined;
    }
    
    // Update fields if they exist in the updates object
    if (updates.name !== undefined) {
      user.name = updates.name;
    }
    
    if (updates.email !== undefined) {
      user.email = updates.email;
    }
    
    if (updates.profileImage !== undefined) {
      user.profileImage = updates.profileImage;
    }
    
    // Update the timestamp
    user.updatedAt = new Date();
    
    // Save the updated user
    this.users.set(userId, user);
    
    return user;
  }

  private initializeDemoData() {
    // Create a demo user for development purposes
    const demoUser: InsertUser = {
      username: 'devuser',
      password: 'password',
      name: 'Development User',
      email: 'dev@example.com'
    };
    
    this.createUser(demoUser).then(user => {
      const userId = user.id;
      
      // This is only used initially to provide some data structure
      // This will be replaced by user-created data as they use the app
      const demoInvestments: InsertInvestment[] = [
        {
          symbol: 'CASH',
          name: 'High-Yield Savings',
          type: 'Cash',
          category: 'Cash/Savings',
          price: 1,
          quantity: 325000,
          costBasis: 325000,
          logoColor: 'green',
          logoInitial: 'C',
          notes: 'Emergency fund and short-term savings',
          userId
        },
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          type: 'Stock',
          category: 'Stocks/Bonds/ETFs',
          price: 198.78,
          quantity: 2500,
          costBasis: 420000,
          logoColor: 'blue',
          logoInitial: 'A',
          notes: 'Long-term investment in technology sector',
          userId
        },
        {
          symbol: 'TSLA',
          name: 'Tesla, Inc.',
          type: 'Stock',
          category: 'Stocks/Bonds/ETFs',
          price: 254.12,
          quantity: 1200,
          costBasis: 280000,
          logoColor: 'green',
          logoInitial: 'T',
          notes: 'Electric vehicle growth potential',
          userId
        },
        {
          symbol: 'VTI',
          name: 'Vanguard Total Stock Market ETF',
          type: 'ETF',
          category: 'Stocks/Bonds/ETFs',
          price: 231.85,
          quantity: 2800,
          costBasis: 560000,
          logoColor: 'purple',
          logoInitial: 'V',
          notes: 'Core ETF holding for diversification',
          userId
        },
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          type: 'Crypto',
          category: 'Crypto',
          price: 67865.12,
          quantity: 8.5,
          costBasis: 510000,
          logoColor: 'amber',
          logoInitial: 'B',
          notes: 'Cryptocurrency exposure',
          userId
        },
        {
          symbol: 'IRA',
          name: 'Roth IRA - Index Funds',
          type: 'ETF',
          category: 'IRA/Retirement',
          price: 1,
          quantity: 163500,
          costBasis: 150000,
          logoColor: 'indigo',
          logoInitial: 'R',
          notes: 'Retirement account with diversified allocation',
          userId
        },
        {
          symbol: 'STARTUPX',
          name: 'StartupX Equity',
          type: 'Other',
          category: 'Private Equity',
          price: 1,
          quantity: 250000,
          costBasis: 175000,
          logoColor: 'orange',
          logoInitial: 'S',
          notes: 'Private equity in tech startup',
          userId
        },
        {
          symbol: 'REAL_ESTATE_1',
          name: 'Residential Rental Property',
          type: 'Real Estate',
          category: 'Real Estate',
          price: 1,
          quantity: 425000,
          costBasis: 375000,
          logoColor: 'pink',
          logoInitial: 'R',
          notes: 'Single-family rental property',
          userId
        },
        {
          symbol: 'LOAN_1',
          name: 'P2P Lending Portfolio',
          type: 'Other',
          category: 'Loans Distributed',
          price: 1,
          quantity: 75000,
          costBasis: 75000,
          logoColor: 'blue',
          logoInitial: 'L',
          notes: 'Distributed peer-to-peer loans',
          userId
        },
        {
          symbol: 'VCFUND',
          name: 'Venture Capital Fund',
          type: 'Other',
          category: 'Venture Capital/Angel',
          price: 1,
          quantity: 100000,
          costBasis: 100000,
          logoColor: 'purple',
          logoInitial: 'V',
          notes: 'Early-stage venture investments',
          userId
        }
      ];
      
      // Add the demo investments
      demoInvestments.forEach(investment => this.createInvestment(investment));
      
      // Create some demo activities
      setTimeout(() => {
        // Create a buy activity for Apple
        const activity: InsertActivity = {
          type: 'BUY',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
          investmentId: 1,
          investmentName: 'Apple Inc.',
          price: 165.22,
          quantity: 100,
          amount: 16522,
          description: 'Purchased AAPL shares',
          userId
        };
        this.createActivity(activity);
        
      }, 100);
      
      // Add a dividend activity
      setTimeout(() => {
        const dividendActivity: InsertActivity = {
          type: 'DIVIDEND',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days ago
          investmentId: 1,
          investmentName: 'Apple Inc.',
          amount: 322.5,
          description: 'Quarterly dividend payment',
          userId
        };
        this.createActivity(dividendActivity);
      }, 200);
      
      // Add a deposit activity
      setTimeout(() => {
        const depositActivity: InsertActivity = {
          type: 'DEPOSIT',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
          amount: 50000,
          description: 'Initial funding deposit',
          userId
        };
        this.createActivity(depositActivity);
      }, 300);
      
      // Create demo budget items
      setTimeout(() => {
        const currentDate = new Date();
        
        const demoBudgetItems: InsertBudgetItem[] = [
          {
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5),
            name: 'Rent / Mortgage',
            amount: 2500,
            category: 'Housing',
            userId
          },
          {
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
            name: 'Groceries',
            amount: 800,
            category: 'Food',
            userId
          },
          {
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
            name: 'Car Payment',
            amount: 450,
            category: 'Transportation',
            userId
          },
          {
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20),
            name: 'Utilities',
            amount: 320,
            category: 'Utilities',
            userId
          },
          {
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 25),
            name: 'Entertainment',
            amount: 200,
            category: 'Entertainment',
            userId
          }
        ];
        
        demoBudgetItems.forEach(item => this.createBudgetItem(item));
      }, 400);
      
      // Create demo financial goals
      const demoGoals: InsertFinancialGoal[] = [
        {
          name: "Emergency Fund",
          type: "Savings",
          targetAmount: "10000",
          currentAmount: "6500",
          startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
          targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
          notes: "3-month emergency fund",
          userId
        },
        {
          name: "Pay Off Credit Card",
          type: "Debt Payoff",
          targetAmount: "5000",
          currentAmount: "2000",
          startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
          targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
          notes: "High-interest debt",
          userId
        },
        {
          name: "Vacation Fund",
          type: "Savings",
          targetAmount: "3000",
          currentAmount: "1500",
          startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150),
          notes: "Summer vacation trip",
          userId
        }
      ];
      
      setTimeout(() => {
        demoGoals.forEach(goal => this.createFinancialGoal(goal));
      }, 500);
      
      // Create demo notes
      const demoNotes: InsertFinancialNote[] = [
        {
          title: "Investment Strategy 2025",
          content: "# 2025 Strategy\n\n- Focus on increasing ETF allocation\n- Research renewable energy sector\n- Rebalance portfolio quarterly\n- Reduce high-risk positions",
          category: "Strategy",
          recordDate: new Date(),
          tags: ["investments", "strategy", "2025"],
          userId
        },
        {
          title: "Real Estate Market Notes",
          content: "## Market Research\n\nReal estate in the southwest continues to appreciate at 5-7% annually. Consider investment opportunities in:\n\n- Residential multi-family\n- Commercial retail in growing suburbs\n- REITs focused on healthcare facilities",
          category: "Investment",
          recordDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          tags: ["real estate", "research"],
          userId
        }
      ];
      
      setTimeout(() => {
        demoNotes.forEach(note => this.createFinancialNote(note));
      }, 600);
      
      // Create demo liabilities
      const demoLiabilities: InsertLiability[] = [
        {
          name: "Mortgage",
          type: "Mortgage",
          amount: 320000,
          interestRate: 4.5,
          minimumPayment: 1800,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
          userId
        },
        {
          name: "Car Loan",
          type: "Auto Loan",
          amount: 25000,
          interestRate: 3.9,
          minimumPayment: 450,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
          userId
        },
        {
          name: "Credit Card",
          type: "Credit Card",
          amount: 4500,
          interestRate: 17.99,
          minimumPayment: 150,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
          userId
        }
      ];
      
      setTimeout(() => {
        demoLiabilities.forEach(liability => this.createLiability(liability));
      }, 100);
    });
  }

  // Investment methods
  async getInvestment(id: number): Promise<Investment | undefined> {
    return this.investments.get(id);
  }

  async getAllInvestments(userId?: number): Promise<Investment[]> {
    const investments = Array.from(this.investments.values());
    if (userId) {
      return investments.filter(investment => investment.userId === userId);
    }
    return investments;
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const id = this.investmentIdCounter++;
    const value = investment.price * investment.quantity;
    const performanceValue = value - investment.costBasis;
    const performancePercent = (investment.costBasis > 0) 
      ? (performanceValue / investment.costBasis) * 100 
      : 0;
    
    // Determine if performance history should trend up or down based on performance
    const trend = performancePercent >= 0 ? 'up' : 'down';
    
    const newInvestment: Investment = {
      id,
      ...investment,
      value,
      performanceValue,
      performancePercent,
      performanceHistory: generatePerformanceData(trend),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.investments.set(id, newInvestment);
    return newInvestment;
  }

  async updateInvestment(id: number, investmentData: InsertInvestment): Promise<Investment> {
    const existingInvestment = await this.getInvestment(id);
    
    if (!existingInvestment) {
      throw new Error(`Investment with id ${id} not found`);
    }
    
    const value = investmentData.price * investmentData.quantity;
    const performanceValue = value - investmentData.costBasis;
    const performancePercent = (investmentData.costBasis > 0) 
      ? (performanceValue / investmentData.costBasis) * 100 
      : 0;
    
    // Determine if we should adjust the performance history trend
    const prevPerformance = existingInvestment.performancePercent;
    const newPerformance = performancePercent;
    let performanceHistory = [...existingInvestment.performanceHistory];
    
    // If performance changed significantly, adjust the history trend
    if (Math.abs(newPerformance - prevPerformance) > 5) {
      const trend = newPerformance >= prevPerformance ? 'up' : 'down';
      performanceHistory = generatePerformanceData(trend);
    }
    
    const updatedInvestment: Investment = {
      ...existingInvestment,
      ...investmentData,
      id,
      value,
      performanceValue,
      performancePercent,
      performanceHistory,
      updatedAt: new Date()
    };
    
    this.investments.set(id, updatedInvestment);
    return updatedInvestment;
  }

  async deleteInvestment(id: number): Promise<void> {
    const exists = this.investments.has(id);
    
    if (!exists) {
      throw new Error(`Investment with id ${id} not found`);
    }
    
    this.investments.delete(id);
    
    // Delete associated activities
    const activitiesToDelete = Array.from(this.activities.values())
      .filter(activity => activity.investmentId === id);
    
    for (const activity of activitiesToDelete) {
      this.activities.delete(activity.id);
    }
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getAllActivities(userId?: number): Promise<Activity[]> {
    let activities = Array.from(this.activities.values());
    
    if (userId) {
      activities = activities.filter(activity => activity.userId === userId);
    }
    
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getRecentActivities(limit: number, userId?: number): Promise<Activity[]> {
    const activities = await this.getAllActivities(userId);
    return activities.slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    
    const newActivity: Activity = {
      id,
      ...activity,
      createdAt: new Date()
    };
    
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Budget methods
  async getBudgetItem(id: number): Promise<BudgetItem | undefined> {
    return this.budgetItems.get(id);
  }
  
  async getAllBudgetItems(userId: number): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getBudgetItemsByCategory(userId: number, category: string): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values())
      .filter(item => item.userId === userId && item.category === category)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createBudgetItem(budgetItem: InsertBudgetItem): Promise<BudgetItem> {
    const id = this.budgetItemIdCounter++;
    
    const newBudgetItem: BudgetItem = {
      id,
      ...budgetItem,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.budgetItems.set(id, newBudgetItem);
    return newBudgetItem;
  }
  
  async updateBudgetItem(id: number, budgetItem: InsertBudgetItem): Promise<BudgetItem> {
    const existingItem = await this.getBudgetItem(id);
    
    if (!existingItem) {
      throw new Error(`Budget item with id ${id} not found`);
    }
    
    const updatedItem: BudgetItem = {
      ...existingItem,
      ...budgetItem,
      id,
      updatedAt: new Date()
    };
    
    this.budgetItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteBudgetItem(id: number): Promise<void> {
    const exists = this.budgetItems.has(id);
    
    if (!exists) {
      throw new Error(`Budget item with id ${id} not found`);
    }
    
    this.budgetItems.delete(id);
  }
  
  // Liability methods
  async getLiability(id: number): Promise<Liability | undefined> {
    return this.liabilities.get(id);
  }
  
  async getAllLiabilities(userId: number): Promise<Liability[]> {
    return Array.from(this.liabilities.values())
      .filter(liability => liability.userId === userId)
      .sort((a, b) => (b.amount - a.amount));
  }
  
  async getLiabilitiesByType(userId: number, type: string): Promise<Liability[]> {
    return Array.from(this.liabilities.values())
      .filter(liability => liability.userId === userId && liability.type === type)
      .sort((a, b) => (b.amount - a.amount));
  }
  
  async createLiability(liability: InsertLiability): Promise<Liability> {
    const id = this.liabilityIdCounter++;
    
    const newLiability: Liability = {
      id,
      ...liability,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.liabilities.set(id, newLiability);
    return newLiability;
  }
  
  async updateLiability(id: number, liability: InsertLiability): Promise<Liability> {
    const existingLiability = await this.getLiability(id);
    
    if (!existingLiability) {
      throw new Error(`Liability with id ${id} not found`);
    }
    
    const updatedLiability: Liability = {
      ...existingLiability,
      ...liability,
      id,
      updatedAt: new Date()
    };
    
    this.liabilities.set(id, updatedLiability);
    return updatedLiability;
  }
  
  async deleteLiability(id: number): Promise<void> {
    const exists = this.liabilities.has(id);
    
    if (!exists) {
      throw new Error(`Liability with id ${id} not found`);
    }
    
    this.liabilities.delete(id);
  }
  
  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }
  
  async getAllPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  
  async getUpcomingPayments(userId: number, days: number): Promise<Payment[]> {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    return Array.from(this.payments.values())
      .filter(payment => 
        payment.userId === userId && 
        !payment.isPaid && 
        new Date(payment.dueDate) <= futureDate
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    
    const newPayment: Payment = {
      id,
      ...payment,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.payments.set(id, newPayment);
    return newPayment;
  }
  
  async updatePayment(id: number, payment: InsertPayment): Promise<Payment> {
    const existingPayment = await this.getPayment(id);
    
    if (!existingPayment) {
      throw new Error(`Payment with id ${id} not found`);
    }
    
    const updatedPayment: Payment = {
      ...existingPayment,
      ...payment,
      id,
      updatedAt: new Date()
    };
    
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  async deletePayment(id: number): Promise<void> {
    const exists = this.payments.has(id);
    
    if (!exists) {
      throw new Error(`Payment with id ${id} not found`);
    }
    
    this.payments.delete(id);
  }
  
  // Financial Goal methods
  async getFinancialGoal(id: number): Promise<FinancialGoal | undefined> {
    return this.financialGoals.get(id);
  }
  
  async getAllFinancialGoals(userId: number): Promise<FinancialGoal[]> {
    return Array.from(this.financialGoals.values())
      .filter(goal => goal.userId === userId)
      .sort((a, b) => {
        // Sort by completion status first, then by progress percentage
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1; // Incomplete goals first
        }
        
        const aProgress = Number(a.currentAmount) / Number(a.targetAmount) * 100;
        const bProgress = Number(b.currentAmount) / Number(b.targetAmount) * 100;
        return bProgress - aProgress; // Higher progress first
      });
  }
  
  async getFinancialGoalsByType(userId: number, type: string): Promise<FinancialGoal[]> {
    return Array.from(this.financialGoals.values())
      .filter(goal => goal.userId === userId && goal.type === type)
      .sort((a, b) => {
        // Sort by completion status first, then by progress percentage
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1; // Incomplete goals first
        }
        
        const aProgress = Number(a.currentAmount) / Number(a.targetAmount) * 100;
        const bProgress = Number(b.currentAmount) / Number(b.targetAmount) * 100;
        return bProgress - aProgress; // Higher progress first
      });
  }
  
  async createFinancialGoal(goal: InsertFinancialGoal): Promise<FinancialGoal> {
    const id = this.financialGoalIdCounter++;
    
    const newGoal: FinancialGoal = {
      id,
      ...goal,
      currentAmount: goal.currentAmount || "0",
      isCompleted: false,
      completedDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.financialGoals.set(id, newGoal);
    return newGoal;
  }
  
  async updateFinancialGoal(id: number, goalData: Partial<InsertFinancialGoal>): Promise<FinancialGoal> {
    const existingGoal = await this.getFinancialGoal(id);
    
    if (!existingGoal) {
      throw new Error(`Financial goal with id ${id} not found`);
    }
    
    const updatedGoal: FinancialGoal = {
      ...existingGoal,
      ...goalData,
      id,
      updatedAt: new Date()
    };
    
    this.financialGoals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async updateGoalProgress(id: number, currentAmount: number): Promise<FinancialGoal> {
    const existingGoal = await this.getFinancialGoal(id);
    
    if (!existingGoal) {
      throw new Error(`Financial goal with id ${id} not found`);
    }
    
    const isCompleted = currentAmount >= Number(existingGoal.targetAmount);
    const updatedGoal: FinancialGoal = {
      ...existingGoal,
      currentAmount: currentAmount.toString(),
      isCompleted,
      completedDate: isCompleted ? new Date() : null,
      updatedAt: new Date()
    };
    
    this.financialGoals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async completeGoal(id: number): Promise<FinancialGoal> {
    const existingGoal = await this.getFinancialGoal(id);
    
    if (!existingGoal) {
      throw new Error(`Financial goal with id ${id} not found`);
    }
    
    const updatedGoal: FinancialGoal = {
      ...existingGoal,
      currentAmount: existingGoal.targetAmount, // Set to target amount
      isCompleted: true,
      completedDate: new Date(),
      updatedAt: new Date()
    };
    
    this.financialGoals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteFinancialGoal(id: number): Promise<void> {
    const exists = this.financialGoals.has(id);
    
    if (!exists) {
      throw new Error(`Financial goal with id ${id} not found`);
    }
    
    this.financialGoals.delete(id);
  }
  
  // Financial Notes methods
  async getFinancialNote(id: number): Promise<FinancialNote | undefined> {
    return this.financialNotes.get(id);
  }
  
  async getAllFinancialNotes(userId: number): Promise<FinancialNote[]> {
    return Array.from(this.financialNotes.values())
      .filter(note => note.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  
  async getFinancialNotesByCategory(userId: number, category: string): Promise<FinancialNote[]> {
    return Array.from(this.financialNotes.values())
      .filter(note => note.userId === userId && note.category === category)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  
  async createFinancialNote(note: InsertFinancialNote): Promise<FinancialNote> {
    const id = this.financialNoteIdCounter++;
    
    const newNote: FinancialNote = {
      id,
      ...note,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.financialNotes.set(id, newNote);
    return newNote;
  }
  
  async updateFinancialNote(id: number, noteData: Partial<InsertFinancialNote>): Promise<FinancialNote> {
    const existingNote = await this.getFinancialNote(id);
    
    if (!existingNote) {
      throw new Error(`Financial note with id ${id} not found`);
    }
    
    const updatedNote: FinancialNote = {
      ...existingNote,
      ...noteData,
      id,
      updatedAt: new Date()
    };
    
    this.financialNotes.set(id, updatedNote);
    return updatedNote;
  }
  
  async deleteFinancialNote(id: number): Promise<void> {
    const exists = this.financialNotes.has(id);
    
    if (!exists) {
      throw new Error(`Financial note with id ${id} not found`);
    }
    
    this.financialNotes.delete(id);
  }
  
  // Chat message methods
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    // Implementation placeholder - will be fully implemented in future updates
    return undefined;
  }
  
  async getChatMessagesByConversation(userId: number, conversationId: string): Promise<ChatMessage[]> {
    // Implementation placeholder - will be fully implemented in future updates
    return [];
  }
  
  async getAllUserConversations(userId: number): Promise<{ conversationId: string, lastMessage: string, lastUpdated: Date }[]> {
    // Implementation placeholder - will be fully implemented in future updates
    return [];
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    // Implementation placeholder - will be fully implemented in future updates
    const now = new Date();
    return {
      id: 0,
      ...message,
      createdAt: now
    } as ChatMessage;
  }
  
  // Portfolio analysis methods
  async getPortfolioSummary(userId?: number): Promise<PortfolioSummary> {
    const investments = userId 
      ? Array.from(this.investments.values()).filter(inv => inv.userId === userId)
      : Array.from(this.investments.values());
    
    const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);
    const totalCost = investments.reduce((sum, inv) => sum + inv.costBasis, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    
    // Simulate day change (in a real app this would use historical data)
    const dayChange = totalValue * (Math.random() * 0.02 - 0.01); // -1% to +1%
    const dayChangePercent = (dayChange / totalValue) * 100;
    
    // Simulate monthly change (in a real app this would use historical data)
    const monthlyChange = totalValue * (Math.random() * 0.06 - 0.02); // -2% to +4%
    const monthlyChangePercent = (monthlyChange / totalValue) * 100;
    
    return {
      totalValue,
      totalGain,
      totalGainPercent,
      dayChange,
      dayChangePercent,
      monthlyChange,
      monthlyChangePercent
    };
  }
  
  async getAssetAllocation(userId?: number): Promise<AssetAllocation[]> {
    const investments = userId 
      ? Array.from(this.investments.values()).filter(inv => inv.userId === userId)
      : Array.from(this.investments.values());
    
    const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);
    
    // Group by type and calculate percentages
    const groupedByType: Record<string, number> = {};
    
    for (const inv of investments) {
      const type = inv.type;
      if (!groupedByType[type]) {
        groupedByType[type] = 0;
      }
      groupedByType[type] += inv.value;
    }
    
    // Convert to array with percentages
    const result: AssetAllocation[] = [];
    
    for (const type of Object.keys(groupedByType)) {
      const value = groupedByType[type];
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      
      result.push({
        type,
        percentage,
        color: assetColors[type] || '#6B7280' // Default to gray if type not found
      });
    }
    
    // Sort by percentage (descending)
    result.sort((a, b) => b.percentage - a.percentage);
    
    return result;
  }
  
  async getPerformanceHistory(timeframe: string = '1M', userId?: number): Promise<PerformanceHistory> {
    // In a real app, this would retrieve historical performance data from a database
    // For this demo, we'll generate synthetic data
    
    const result: PerformanceHistoryEntry[] = [];
    const now = new Date();
    
    // Determine number of data points and interval based on timeframe
    let dataPoints = 30;
    let intervalDays = 1;
    
    switch (timeframe) {
      case '3M':
        dataPoints = 90;
        intervalDays = 3;
        break;
      case '6M':
        dataPoints = 180;
        intervalDays = 6;
        break;
      case '1Y':
        dataPoints = 365;
        intervalDays = 12;
        break;
      case 'ALL':
        dataPoints = 730; // ~2 years
        intervalDays = 30;
        break;
      default:
        // Default to 1M
        dataPoints = 30;
        intervalDays = 1;
    }
    
    // Generate the historical data (simple upward trend with noise)
    let value = 100000; // Starting value
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i * intervalDays);
      
      // Add some noise to the value (mostly upward trend)
      value = value + value * (Math.random() * 0.02 - 0.005); // -0.5% to +1.5%
      
      const dataPoint: PerformanceHistoryEntry = {
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        value
      };
      
      result.push(dataPoint);
    }
    
    return {
      data: result,
      timeframe: timeframe as '1M' | '3M' | '6M' | '1Y' | 'ALL',
    };
  }
  
  async getPortfolioRebalance(userId?: number, riskProfile: 'conservative' | 'balanced' | 'growth' | 'aggressive' | 'custom' = 'balanced'): Promise<PortfolioRebalance> {
    const investments = userId 
      ? Array.from(this.investments.values()).filter(inv => inv.userId === userId)
      : Array.from(this.investments.values());
    
    const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);
    
    // Group by type to get current allocation
    const currentAllocation: Record<string, number> = {};
    
    for (const type of assetTypes) {
      currentAllocation[type] = 0;
    }
    
    for (const inv of investments) {
      const type = inv.type;
      currentAllocation[type] += inv.value;
    }
    
    // Get target allocation for the selected risk profile
    const targetProfile = targetAllocations[riskProfile];
    
    // Create rebalance suggestions
    const suggestions: RebalanceSuggestion[] = [];
    
    for (const type of assetTypes) {
      const currentValue = currentAllocation[type];
      const currentAllocationPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
      const targetAllocationPercent = targetProfile[type];
      const targetValue = (targetAllocationPercent / 100) * totalValue;
      const valueDifference = targetValue - currentValue;
      
      let action: 'buy' | 'sell' | 'hold' = 'hold';
      if (valueDifference > 1000) {
        action = 'buy';
      } else if (valueDifference < -1000) {
        action = 'sell';
      }
      
      suggestions.push({
        type,
        currentAllocation: currentAllocationPercent,
        targetAllocation: targetAllocationPercent,
        currentValue,
        targetValue,
        valueDifference,
        action,
        color: assetColors[type] || '#6B7280'
      });
    }
    
    // Sort suggestions by absolute value difference (largest first)
    suggestions.sort((a, b) => Math.abs(b.valueDifference) - Math.abs(a.valueDifference));
    
    return {
      totalPortfolioValue: totalValue,
      suggestions,
      riskProfile
    };
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // PostgreSQL session store with automatic table creation
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session', // Explicit table name
      schemaName: 'public', // Use public schema
      ttl: 60 * 60 * 24 * 30, // 30 days session TTL (in seconds)
      disableTouch: false // Update expiration on session access
    });
  }

  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    if (!firebaseUid) return undefined;
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }
  
  async getUserByResetToken(resetToken: string): Promise<User | undefined> {
    if (!resetToken) return undefined;
    const [user] = await db.select().from(users).where(eq(users.resetToken, resetToken));
    return user || undefined;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUserLastLogin(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        lastLogin: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
  
  async updateUserFirebaseInfo(userId: number, firebaseUid: string, emailVerified: boolean, photoURL: string | null): Promise<void> {
    await db.update(users)
      .set({ 
        firebaseUid, 
        emailVerified,
        profileImage: photoURL || undefined,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    if (!firebaseUid) return undefined;
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async updateUserResetToken(userId: number, resetToken: string, expiryDate: Date): Promise<void> {
    await db.update(users)
      .set({ 
        resetToken,
        resetTokenExpiry: expiryDate,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
  
  async clearUserResetToken(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
  
  async updateUserFirebaseInfo(
    userId: number, 
    firebaseUid: string, 
    emailVerified: boolean = false,
    profileImage: string | null = null
  ): Promise<void> {
    const updates: any = { 
      firebaseUid,
      emailVerified,
      updatedAt: new Date()
    };
    
    // Only update profile image if provided
    if (profileImage) {
      updates.profileImage = profileImage;
    }
    
    await db.update(users)
      .set(updates)
      .where(eq(users.id, userId));
  }
  
  async updateUser(
    userId: number, 
    updates: {name?: string, email?: string, profileImage?: string}
  ): Promise<User | undefined> {
    // Create an object to store the updates
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Only include fields that are provided
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.profileImage !== undefined) updateData.profileImage = updates.profileImage;
    
    // Update the user
    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }



  // Investment methods
  async getInvestment(id: number): Promise<Investment | undefined> {
    const [investment] = await db.select().from(investments).where(eq(investments.id, id));
    return investment || undefined;
  }

  async getAllInvestments(userId?: number): Promise<Investment[]> {
    if (userId) {
      return db.select().from(investments).where(eq(investments.userId, userId));
    } else {
      return db.select().from(investments);
    }
  }

  async createInvestment(investmentData: InsertInvestment): Promise<Investment> {
    const [investment] = await db.insert(investments).values(investmentData).returning();
    return investment;
  }

  async updateInvestment(id: number, investmentData: InsertInvestment): Promise<Investment> {
    const [updated] = await db
      .update(investments)
      .set(investmentData)
      .where(eq(investments.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Investment with id ${id} not found`);
    }
    
    return updated;
  }

  async deleteInvestment(id: number): Promise<void> {
    await db.delete(investments).where(eq(investments.id, id));
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async getAllActivities(userId?: number): Promise<Activity[]> {
    if (userId) {
      return db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.date));
    } else {
      return db.select().from(activities).orderBy(desc(activities.date));
    }
  }

  async getRecentActivities(limit: number, userId?: number): Promise<Activity[]> {
    if (userId) {
      return db.select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.date))
        .limit(limit);
    } else {
      return db.select()
        .from(activities)
        .orderBy(desc(activities.date))
        .limit(limit);
    }
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(activityData).returning();
    return activity;
  }

  // Budget methods
  async getBudgetItem(id: number): Promise<BudgetItem | undefined> {
    const [budgetItem] = await db.select().from(budgetItems).where(eq(budgetItems.id, id));
    return budgetItem || undefined;
  }

  async getAllBudgetItems(userId: number): Promise<BudgetItem[]> {
    return db.select().from(budgetItems).where(eq(budgetItems.userId, userId)).orderBy(desc(budgetItems.date));
  }

  async getBudgetItemsByCategory(userId: number, category: string): Promise<BudgetItem[]> {
    return db.select()
      .from(budgetItems)
      .where(and(eq(budgetItems.userId, userId), eq(budgetItems.category, category)))
      .orderBy(desc(budgetItems.date));
  }

  async createBudgetItem(budgetItemData: InsertBudgetItem): Promise<BudgetItem> {
    const [budgetItem] = await db.insert(budgetItems).values(budgetItemData).returning();
    return budgetItem;
  }

  async updateBudgetItem(id: number, budgetItemData: InsertBudgetItem): Promise<BudgetItem> {
    const [updated] = await db
      .update(budgetItems)
      .set(budgetItemData)
      .where(eq(budgetItems.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Budget item with id ${id} not found`);
    }
    
    return updated;
  }

  async deleteBudgetItem(id: number): Promise<void> {
    await db.delete(budgetItems).where(eq(budgetItems.id, id));
  }

  // Liability methods
  async getLiability(id: number): Promise<Liability | undefined> {
    const [liability] = await db.select().from(liabilities).where(eq(liabilities.id, id));
    return liability || undefined;
  }

  async getAllLiabilities(userId: number): Promise<Liability[]> {
    return db.select().from(liabilities).where(eq(liabilities.userId, userId));
  }

  async getLiabilitiesByType(userId: number, type: string): Promise<Liability[]> {
    return db.select()
      .from(liabilities)
      .where(and(eq(liabilities.userId, userId), eq(liabilities.type, type)));
  }

  async createLiability(liabilityData: InsertLiability): Promise<Liability> {
    const [liability] = await db.insert(liabilities).values(liabilityData).returning();
    return liability;
  }

  async updateLiability(id: number, liabilityData: InsertLiability): Promise<Liability> {
    const [updated] = await db
      .update(liabilities)
      .set(liabilityData)
      .where(eq(liabilities.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Liability with id ${id} not found`);
    }
    
    return updated;
  }

  async deleteLiability(id: number): Promise<void> {
    await db.delete(liabilities).where(eq(liabilities.id, id));
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getAllPayments(userId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.dueDate));
  }

  async getUpcomingPayments(userId: number, days: number): Promise<Payment[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);
    
    return db.select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, userId),
          eq(payments.isPaid, false),
          // dueDate between now and future
        )
      )
      .orderBy(payments.dueDate);
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
  }

  async updatePayment(id: number, paymentData: InsertPayment): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set(paymentData)
      .where(eq(payments.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Payment with id ${id} not found`);
    }
    
    return updated;
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // Financial Goal methods
  async getFinancialGoal(id: number): Promise<FinancialGoal | undefined> {
    const [goal] = await db.select().from(financialGoals).where(eq(financialGoals.id, id));
    return goal || undefined;
  }

  async getAllFinancialGoals(userId: number): Promise<FinancialGoal[]> {
    return db.select().from(financialGoals).where(eq(financialGoals.userId, userId));
  }

  async getFinancialGoalsByType(userId: number, type: string): Promise<FinancialGoal[]> {
    return db.select()
      .from(financialGoals)
      .where(and(eq(financialGoals.userId, userId), eq(financialGoals.type, type)));
  }

  async createFinancialGoal(goalData: InsertFinancialGoal): Promise<FinancialGoal> {
    const [goal] = await db.insert(financialGoals).values(goalData).returning();
    return goal;
  }

  async updateFinancialGoal(id: number, goalData: Partial<InsertFinancialGoal>): Promise<FinancialGoal> {
    const [updated] = await db
      .update(financialGoals)
      .set(goalData)
      .where(eq(financialGoals.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Financial goal with id ${id} not found`);
    }
    
    return updated;
  }

  async updateGoalProgress(id: number, currentAmount: number): Promise<FinancialGoal> {
    const [updated] = await db
      .update(financialGoals)
      .set({ currentAmount: currentAmount.toString() }) // Convert to string since our schema uses numeric
      .where(eq(financialGoals.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Financial goal with id ${id} not found`);
    }
    
    return updated;
  }

  async completeGoal(id: number): Promise<FinancialGoal> {
    const [updated] = await db
      .update(financialGoals)
      .set({ 
        isCompleted: true, 
        completedDate: new Date() 
      })
      .where(eq(financialGoals.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Financial goal with id ${id} not found`);
    }
    
    return updated;
  }

  async deleteFinancialGoal(id: number): Promise<void> {
    await db.delete(financialGoals).where(eq(financialGoals.id, id));
  }

  // Financial Note methods
  async getFinancialNote(id: number): Promise<FinancialNote | undefined> {
    const [note] = await db.select().from(financialNotes).where(eq(financialNotes.id, id));
    return note || undefined;
  }

  async getAllFinancialNotes(userId: number): Promise<FinancialNote[]> {
    return db.select().from(financialNotes).where(eq(financialNotes.userId, userId));
  }

  async getFinancialNotesByCategory(userId: number, category: string): Promise<FinancialNote[]> {
    return db.select()
      .from(financialNotes)
      .where(and(eq(financialNotes.userId, userId), eq(financialNotes.category, category)));
  }

  async createFinancialNote(noteData: InsertFinancialNote): Promise<FinancialNote> {
    const [note] = await db.insert(financialNotes).values(noteData).returning();
    return note;
  }

  async updateFinancialNote(id: number, noteData: Partial<InsertFinancialNote>): Promise<FinancialNote> {
    const [updated] = await db
      .update(financialNotes)
      .set(noteData)
      .where(eq(financialNotes.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Financial note with id ${id} not found`);
    }
    
    return updated;
  }

  async deleteFinancialNote(id: number): Promise<void> {
    await db.delete(financialNotes).where(eq(financialNotes.id, id));
  }

  // Chat message methods
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [message] = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.id, id));
    return message || undefined;
  }
  
  async getChatMessagesByConversation(userId: number, conversationId: string): Promise<ChatMessage[]> {
    return db.select()
      .from(chatMessages)
      .where(and(
        eq(chatMessages.userId, userId),
        eq(chatMessages.conversationId, conversationId)
      ))
      .orderBy(asc(chatMessages.createdAt));
  }
  
  async getAllUserConversations(userId: number): Promise<{ conversationId: string, lastMessage: string, lastUpdated: Date }[]> {
    // This would be a more complex query in the actual implementation
    // For now, we'll use a basic implementation
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt));
    
    // Group by conversation ID and take most recent message
    const conversations = new Map<string, { lastMessage: string, lastUpdated: Date }>();
    
    for (const message of messages) {
      if (!conversations.has(message.conversationId)) {
        conversations.set(message.conversationId, {
          lastMessage: message.content,
          lastUpdated: message.createdAt
        });
      }
    }
    
    // Convert map to array
    return Array.from(conversations.entries()).map(([conversationId, data]) => ({
      conversationId,
      ...data
    }));
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db.insert(chatMessages)
      .values(message)
      .returning();
    return chatMessage;
  }

  // Portfolio analysis methods
  async getPortfolioSummary(userId?: number): Promise<PortfolioSummary> {
    const userInvestments = userId
      ? await this.getAllInvestments(userId)
      : await this.getAllInvestments();
    
    if (userInvestments.length === 0) {
      return {
        totalValue: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        monthlyChange: 0,
        monthlyChangePercent: 0
      };
    }
    
    // Calculate portfolio values
    let totalValue = 0;
    let totalCost = 0;
    
    for (const investment of userInvestments) {
      const quantity = Number(investment.quantity);
      const price = Number(investment.price);
      const costBasis = Number(investment.costBasis);
      
      totalValue += quantity * price;
      totalCost += costBasis;
    }
    
    // Calculate real performance metrics
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    
    // In a real app, these would be calculated based on historical data
    // For this demo, we'll create reasonable simulated values based on the portfolio
    const dayChange = totalValue * 0.005 * (Math.random() > 0.5 ? 1 : -1); // +/- 0.5%
    const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;
    
    const monthlyChange = totalValue * 0.03 * (Math.random() > 0.3 ? 1 : -1); // +/- 3%
    const monthlyChangePercent = totalValue > 0 ? (monthlyChange / totalValue) * 100 : 0;
    
    return {
      totalValue,
      totalGain,
      totalGainPercent,
      dayChange,
      dayChangePercent,
      monthlyChange,
      monthlyChangePercent
    };
  }

  async getAssetAllocation(userId?: number): Promise<AssetAllocation[]> {
    const userInvestments = userId 
      ? await this.getAllInvestments(userId)
      : await this.getAllInvestments();
    
    if (userInvestments.length === 0) {
      return [];
    }
    
    // Group investments by type
    const allocationByType: Record<string, number> = {};
    let totalValue = 0;
    
    // Calculate total value and sum by type
    for (const investment of userInvestments) {
      const value = Number(investment.quantity) * Number(investment.price);
      totalValue += value;
      
      const type = investment.type;
      if (!allocationByType[type]) {
        allocationByType[type] = 0;
      }
      allocationByType[type] += value;
    }
    
    // Convert to percentages and create allocation objects
    return Object.keys(allocationByType).map(type => {
      const percentage = totalValue > 0 ? (allocationByType[type] / totalValue) * 100 : 0;
      return {
        type,
        percentage,
        color: assetColors[type] || '#6B7280' // Default to gray if no color defined
      };
    }).sort((a, b) => b.percentage - a.percentage); // Sort by percentage, highest first
  }

  async getPerformanceHistory(timeframe: string, userId?: number): Promise<PerformanceHistory> {
    const userInvestments = userId 
      ? await this.getAllInvestments(userId)
      : await this.getAllInvestments();
      
    // Return empty data if user has no investments
    if (userInvestments.length === 0) {
      return {
        data: [],
        timeframe: timeframe as 'ALL' | '1Y' | '6M' | '3M' | '1M'
      };
    }
    
    // In a real app, this would fetch historical price data
    // For this demo, we'll generate some fake data
    const days = timeframeToOays(timeframe);
    const data = generatePerformanceData(Math.random() > 0.7 ? 'down' : 'up');
    
    const performanceHistory: PerformanceHistoryEntry[] = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(now.getDate() - (days - i));
      
      performanceHistory.push({
        date: date.toISOString().split('T')[0],
        value: data[i]
      });
    }
    
    return {
      data: performanceHistory,
      timeframe: timeframe as 'ALL' | '1Y' | '6M' | '3M' | '1M'
    };
  }

  async getPortfolioRebalance(userId?: number, riskProfile: 'conservative' | 'balanced' | 'growth' | 'aggressive' | 'custom' = 'balanced'): Promise<PortfolioRebalance> {
    const userInvestments = userId
      ? await this.getAllInvestments(userId)
      : await this.getAllInvestments();
    
    if (userInvestments.length === 0) {
      return {
        totalPortfolioValue: 0,
        suggestions: [],
        riskProfile
      };
    }
    
    // Group investments by type
    const valueByType: Record<string, number> = {};
    let totalValue = 0;
    
    // Calculate total value and sum by type
    for (const investment of userInvestments) {
      const value = Number(investment.quantity) * Number(investment.price);
      totalValue += value;
      
      const type = investment.type;
      if (!valueByType[type]) {
        valueByType[type] = 0;
      }
      valueByType[type] += value;
    }
    
    // Get target allocations based on risk profile
    const targets = targetAllocations[riskProfile];
    
    // Create suggestions based on current vs target allocations
    const suggestions: RebalanceSuggestion[] = [];
    
    for (const type of assetTypes) {
      const currentValue = valueByType[type] || 0;
      const currentAllocation = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
      const targetAllocation = targets[type];
      const targetValue = (targetAllocation / 100) * totalValue;
      const valueDifference = targetValue - currentValue;
      
      const action = 
        Math.abs(valueDifference) < totalValue * 0.01 ? 'hold' : // Less than 1% difference
        valueDifference > 0 ? 'buy' : 'sell';
      
      suggestions.push({
        type,
        currentAllocation,
        targetAllocation,
        currentValue,
        targetValue,
        valueDifference,
        action,
        color: assetColors[type] || '#6B7280'
      });
    }
    
    return {
      totalPortfolioValue: totalValue,
      suggestions: suggestions.sort((a, b) => Math.abs(b.valueDifference) - Math.abs(a.valueDifference)),
      riskProfile
    };
  }
}

// Use database storage for persistence
export const storage = new DatabaseStorage();

// Helper for performance history
function timeframeToOays(timeframe: string): number {
  switch (timeframe) {
    case '1M': return 30;
    case '3M': return 90;
    case '6M': return 180;
    case '1Y': return 365;
    case 'ALL': return 730; // 2 years
    default: return 30;
  }
}