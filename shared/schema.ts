import { pgTable, text, serial, integer, numeric, json, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Chat message roles enum
export const chatMessageRoles = [
  'user',
  'assistant',
  'system'
] as const;

// Asset types enum
export const assetTypes = [
  'Stock',
  'ETF',
  'Crypto',
  'Bond',
  'Real Estate',
  'Cash',
  'Other'
] as const;

// Asset categories enum for grouping in the UI
export const assetCategories = [
  'Cash/Savings',
  'Private Equity',
  'Crypto',
  'Stocks/Bonds/ETFs',
  'IRA/Retirement',
  'Real Estate',
  'Loans Distributed',
  'Venture Capital/Angel'
] as const;

// Activity types enum
export const activityTypes = [
  'BUY',
  'SELL',
  'DIVIDEND',
  'DEPOSIT',
  'WITHDRAWAL'
] as const;

// Define expense categories
export const expenseCategories = [
  'Housing',
  'Transportation',
  'Food',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Personal',
  'Education',
  'Savings',
  'Debt',
  'Other'
] as const;

// Define liability types
export const liabilityTypes = [
  'Mortgage',
  'Auto Loan',
  'Student Loan',
  'Credit Card',
  'Personal Loan',
  'Medical Debt',
  'Tax Debt',
  'Other'
] as const;

// Define financial goal types
export const goalTypes = [
  'Savings',
  'Debt Payoff',
  'Investment',
  'Purchase',
  'Emergency Fund',
  'Retirement',
  'Education',
  'Other'
] as const;

// Define note categories
export const noteCategories = [
  'General',
  'Budget',
  'Investment',
  'Liability',
  'Goal',
  'Strategy',
  'Milestone',
  'Other'
] as const;

// Users table with enhanced security fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: boolean("email_verified").default(false),
  walletAddress: text("wallet_address").unique(), // ThirdWeb wallet address (primary auth)
  firebaseUid: text("firebase_uid").unique(), // Legacy Firebase integration
  profileImage: text("profile_image"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Investments table
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().$type<typeof assetTypes[number]>(),
  category: text("category").$type<typeof assetCategories[number]>(), // Added category field
  price: numeric("price").notNull(),
  quantity: numeric("quantity").notNull(),
  costBasis: numeric("cost_basis").notNull(),
  logoColor: text("logo_color"),
  logoInitial: text("logo_initial"),
  notes: text("notes"),
  performanceHistory: json("performance_history").$type<number[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Budget items table
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  category: text("category").notNull().$type<typeof expenseCategories[number]>(),
  name: text("name").notNull(),
  amount: numeric("amount").notNull(),
  actual: numeric("actual"),
  date: timestamp("date").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  recurrenceFrequency: text("recurrence_frequency"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Liabilities table
export const liabilities = pgTable("liabilities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull().$type<typeof liabilityTypes[number]>(),
  amount: numeric("amount").notNull(),
  interestRate: numeric("interest_rate"),
  minimumPayment: numeric("minimum_payment"),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  amount: numeric("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  isPaid: boolean("is_paid").default(false),
  isRecurring: boolean("is_recurring").default(false),
  recurrenceFrequency: text("recurrence_frequency"),
  category: text("category"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull().$type<typeof activityTypes[number]>(),
  investmentId: integer("investment_id").references(() => investments.id),
  investmentName: text("investment_name"),
  date: timestamp("date").notNull().defaultNow(),
  amount: numeric("amount").notNull(),
  quantity: numeric("quantity"),
  price: numeric("price"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Financial goals table
export const financialGoals = pgTable("financial_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull().$type<typeof goalTypes[number]>(),
  targetAmount: numeric("target_amount").notNull(),
  currentAmount: numeric("current_amount").notNull().default("0"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  targetDate: timestamp("target_date"),
  isCompleted: boolean("is_completed").default(false),
  completedDate: timestamp("completed_date"),
  color: text("color").default("#4f46e5"),
  icon: text("icon"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Notes table for general financial notes and records
export const financialNotes = pgTable("financial_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").$type<typeof noteCategories[number]>().default("General"),
  isPinned: boolean("is_pinned").default(false),
  recordDate: timestamp("record_date").notNull().defaultNow(), // When the note is about
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chat messages table for storing user-AI conversation history
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull().$type<typeof chatMessageRoles[number]>(),
  content: text("content").notNull(),
  conversationId: text("conversation_id").notNull(), // Group messages by conversation
  metadata: json("metadata"), // Store any additional data like processed info or context
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schemas for inserting
export const insertInvestmentSchema = createInsertSchema(investments)
  .omit({
    id: true,
    performanceHistory: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    price: z.coerce.number().positive("Price must be positive"),
    quantity: z.coerce.number().positive("Quantity must be positive"),
    costBasis: z.coerce.number().optional(),
    type: z.enum(assetTypes),
    category: z.enum(assetCategories).optional(),
  });

export const insertActivitySchema = createInsertSchema(activities)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    type: z.enum(activityTypes),
    amount: z.coerce.number().positive("Amount must be positive"),
    quantity: z.coerce.number().positive("Quantity must be positive").optional(),
    price: z.coerce.number().positive("Price must be positive").optional(),
    date: z.coerce.date().default(() => new Date()),
  });

// User schema with stronger password requirements
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
    resetToken: true,
    resetTokenExpiry: true,
    lastLogin: true,
    firebaseUid: true,
    walletAddress: true,
  })
  .extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(1, "Password is required"),
    name: z.string().optional(),
    email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
    profileImage: z.string().optional(),
  });

// Budget items schema
export const insertBudgetItemSchema = createInsertSchema(budgetItems)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    category: z.enum(expenseCategories),
    amount: z.coerce.number().positive("Amount must be positive"),
    actual: z.coerce.number().positive("Actual amount must be positive").optional(),
    date: z.coerce.date(),
  });

// Liabilities schema
export const insertLiabilitySchema = createInsertSchema(liabilities)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    type: z.enum(liabilityTypes),
    amount: z.coerce.number().positive("Amount must be positive"),
    interestRate: z.coerce.number().min(0).optional(),
    minimumPayment: z.coerce.number().positive("Minimum payment must be positive").optional(),
    dueDate: z.coerce.date().optional(),
  });

// Payments schema
export const insertPaymentSchema = createInsertSchema(payments)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    amount: z.coerce.number().positive("Amount must be positive"),
    dueDate: z.coerce.date(),
  });

// Financial goals schema
export const insertFinancialGoalSchema = createInsertSchema(financialGoals)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    isCompleted: true,
    completedDate: true
  })
  .extend({
    type: z.enum(goalTypes),
    targetAmount: z.coerce.number().positive("Target amount must be positive"),
    currentAmount: z.coerce.number().min(0, "Current amount must be at least 0").optional(),
    startDate: z.coerce.date().default(() => new Date()),
    targetDate: z.coerce.date().optional(),
  });

// Types for insertion
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;

export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type BudgetItem = typeof budgetItems.$inferSelect;

export type InsertLiability = z.infer<typeof insertLiabilitySchema>;
export type Liability = typeof liabilities.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertFinancialGoal = z.infer<typeof insertFinancialGoalSchema>;
export type FinancialGoal = typeof financialGoals.$inferSelect;

// Note schema
export const insertFinancialNoteSchema = createInsertSchema(financialNotes)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    category: z.enum(noteCategories),
    content: z.string().min(1, "Note content is required"),
    title: z.string().min(1, "Note title is required"),
    recordDate: z.coerce.date().default(() => new Date()),
    tags: z.array(z.string()).optional(),
  });

export type InsertFinancialNote = z.infer<typeof insertFinancialNoteSchema>;
export type FinancialNote = typeof financialNotes.$inferSelect;

// Chat message schema
export const insertChatMessageSchema = createInsertSchema(chatMessages)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    role: z.enum(chatMessageRoles),
    content: z.string().min(1, "Message content is required"),
    conversationId: z.string().min(1, "Conversation ID is required"),
    metadata: z.any().optional(),
  });

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
