import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertInvestmentSchema, 
  insertActivitySchema, 
  insertBudgetItemSchema,
  insertLiabilitySchema,
  insertPaymentSchema,
  insertFinancialGoalSchema,
  insertFinancialNoteSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { getChatCompletion, analyzeFinancialData, processNaturalLanguageInput, processSpreadsheetData } from "./openai";
import { setupAuth } from "./auth";
import { getMarketData } from "./market-data";
// Firebase service
import { processFirebaseUser } from "./firebase-service";
export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Initialize Firebase service
  try {
    // Firebase setup is simplified now - no Admin SDK needed
    console.log("Firebase authentication service ready");
  } catch (error) {
    console.error("Failed to initialize Firebase service:", error);
  }
  
  const apiRouter = express.Router();
  
  // Auth middleware for protected routes
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Get portfolio summary
  apiRouter.get("/portfolio/summary", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const summary = await storage.getPortfolioSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error getting portfolio summary:", error);
      res.status(500).json({ message: "Failed to get portfolio summary" });
    }
  });

  // Get asset allocation
  apiRouter.get("/portfolio/allocation", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const allocation = await storage.getAssetAllocation(userId);
      res.json(allocation);
    } catch (error) {
      console.error("Error getting asset allocation:", error);
      res.status(500).json({ message: "Failed to get asset allocation" });
    }
  });

  // Get performance history
  apiRouter.get("/portfolio/performance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const timeframe = req.query.timeframe as string || "1M";
      
      console.log(`Getting performance history for timeframe: ${timeframe}`);
      
      const performance = await storage.getPerformanceHistory(timeframe, userId);
      
      // Make sure the response includes the timeframe that was requested
      performance.timeframe = timeframe as any;
      
      res.json(performance);
    } catch (error) {
      console.error("Error getting performance history:", error);
      res.status(500).json({ message: "Failed to get performance history" });
    }
  });
  
  // Get portfolio rebalance suggestions
  apiRouter.get("/portfolio/rebalance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const riskProfile = req.query.riskProfile as 'conservative' | 'balanced' | 'growth' | 'aggressive' | 'custom' || 'balanced';
      const rebalance = await storage.getPortfolioRebalance(userId, riskProfile);
      res.json(rebalance);
    } catch (error) {
      console.error("Error getting portfolio rebalance suggestions:", error);
      res.status(500).json({ message: "Failed to get portfolio rebalance suggestions" });
    }
  });

  // Get all investments
  apiRouter.get("/investments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const investments = await storage.getAllInvestments(userId);
      res.json(investments);
    } catch (error) {
      console.error("Error getting investments:", error);
      res.status(500).json({ message: "Failed to get investments" });
    }
  });

  // Get investment by ID
  apiRouter.get("/investments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const investment = await storage.getInvestment(id);
      
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      // Check if the investment belongs to the authenticated user
      if (investment.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(investment);
    } catch (error) {
      console.error("Error getting investment:", error);
      res.status(500).json({ message: "Failed to get investment" });
    }
  });

  // Create investment
  apiRouter.post("/investments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const investmentData = insertInvestmentSchema.parse({
        ...req.body,
        userId // Ensure the investment is associated with the authenticated user
      });
      
      // If costBasis is not provided, calculate it from price and quantity
      if (!investmentData.costBasis) {
        investmentData.costBasis = investmentData.price * investmentData.quantity;
      }
      
      const newInvestment = await storage.createInvestment(investmentData);
      
      // Create a BUY activity for this investment
      const activityData = {
        type: "BUY" as const,
        userId,
        investmentId: newInvestment.id,
        investmentName: newInvestment.name,
        amount: newInvestment.price * newInvestment.quantity,
        quantity: newInvestment.quantity,
        price: newInvestment.price,
        description: `Added ${newInvestment.quantity} ${newInvestment.type === 'Crypto' ? newInvestment.symbol : (newInvestment.type === 'Stock' || newInvestment.type === 'ETF' ? 'shares of ' : 'units of ')}${newInvestment.name}`,
        date: new Date(),
      };
      
      await storage.createActivity(activityData);
      
      res.status(201).json(newInvestment);
    } catch (error) {
      console.error("Error creating investment:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create investment" });
    }
  });

  // Update investment
  apiRouter.patch("/investments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingInvestment = await storage.getInvestment(id);
      
      if (!existingInvestment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      // Check if the investment belongs to the authenticated user
      if (existingInvestment.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const investmentData = insertInvestmentSchema.parse({
        ...req.body,
        userId // Maintain the user association
      });
      
      // If costBasis is not provided, calculate it from price and quantity
      if (!investmentData.costBasis) {
        investmentData.costBasis = investmentData.price * investmentData.quantity;
      }
      
      const updatedInvestment = await storage.updateInvestment(id, investmentData);
      res.json(updatedInvestment);
    } catch (error) {
      console.error("Error updating investment:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update investment" });
    }
  });

  // Delete investment
  apiRouter.delete("/investments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingInvestment = await storage.getInvestment(id);
      
      if (!existingInvestment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      // Check if the investment belongs to the authenticated user
      if (existingInvestment.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteInvestment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting investment:", error);
      res.status(500).json({ message: "Failed to delete investment" });
    }
  });

  // Get all activities
  apiRouter.get("/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const activities = await storage.getAllActivities(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error getting activities:", error);
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  // Get recent activities
  apiRouter.get("/activities/recent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const limit = parseInt(req.query.limit as string) || 3;
      const activities = await storage.getRecentActivities(limit, userId);
      res.json(activities);
    } catch (error) {
      console.error("Error getting recent activities:", error);
      res.status(500).json({ message: "Failed to get recent activities" });
    }
  });

  // Create activity
  apiRouter.post("/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const activityData = insertActivitySchema.parse({
        ...req.body,
        userId // Ensure the activity is associated with the authenticated user
      });
      
      const newActivity = await storage.createActivity(activityData);
      res.status(201).json(newActivity);
    } catch (error) {
      console.error("Error creating activity:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Budget Items routes
  apiRouter.get("/budget", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const budgetItems = await storage.getAllBudgetItems(userId);
      res.json(budgetItems);
    } catch (error) {
      console.error("Error getting budget items:", error);
      res.status(500).json({ message: "Failed to get budget items" });
    }
  });

  apiRouter.get("/budget/category/:category", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const category = req.params.category;
      const budgetItems = await storage.getBudgetItemsByCategory(userId, category);
      res.json(budgetItems);
    } catch (error) {
      console.error("Error getting budget items by category:", error);
      res.status(500).json({ message: "Failed to get budget items by category" });
    }
  });

  apiRouter.post("/budget", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const budgetItemData = insertBudgetItemSchema.parse({
        ...req.body,
        userId // Ensure the budget item is associated with the authenticated user
      });
      
      const newBudgetItem = await storage.createBudgetItem(budgetItemData);
      res.status(201).json(newBudgetItem);
    } catch (error) {
      console.error("Error creating budget item:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create budget item" });
    }
  });

  apiRouter.patch("/budget/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingBudgetItem = await storage.getBudgetItem(id);
      
      if (!existingBudgetItem) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      // Check if the budget item belongs to the authenticated user
      if (existingBudgetItem.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const budgetItemData = insertBudgetItemSchema.parse({
        ...req.body,
        userId // Maintain the user association
      });
      
      const updatedBudgetItem = await storage.updateBudgetItem(id, budgetItemData);
      res.json(updatedBudgetItem);
    } catch (error) {
      console.error("Error updating budget item:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update budget item" });
    }
  });

  apiRouter.delete("/budget/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingBudgetItem = await storage.getBudgetItem(id);
      
      if (!existingBudgetItem) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      // Check if the budget item belongs to the authenticated user
      if (existingBudgetItem.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteBudgetItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting budget item:", error);
      res.status(500).json({ message: "Failed to delete budget item" });
    }
  });

  // Liabilities routes
  apiRouter.get("/liabilities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const liabilities = await storage.getAllLiabilities(userId);
      res.json(liabilities);
    } catch (error) {
      console.error("Error getting liabilities:", error);
      res.status(500).json({ message: "Failed to get liabilities" });
    }
  });

  apiRouter.get("/liabilities/type/:type", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const type = req.params.type;
      const liabilities = await storage.getLiabilitiesByType(userId, type);
      res.json(liabilities);
    } catch (error) {
      console.error("Error getting liabilities by type:", error);
      res.status(500).json({ message: "Failed to get liabilities by type" });
    }
  });

  apiRouter.post("/liabilities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const liabilityData = insertLiabilitySchema.parse({
        ...req.body,
        userId // Ensure the liability is associated with the authenticated user
      });
      
      const newLiability = await storage.createLiability(liabilityData);
      res.status(201).json(newLiability);
    } catch (error) {
      console.error("Error creating liability:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create liability" });
    }
  });

  apiRouter.patch("/liabilities/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingLiability = await storage.getLiability(id);
      
      if (!existingLiability) {
        return res.status(404).json({ message: "Liability not found" });
      }
      
      // Check if the liability belongs to the authenticated user
      if (existingLiability.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const liabilityData = insertLiabilitySchema.parse({
        ...req.body,
        userId // Maintain the user association
      });
      
      const updatedLiability = await storage.updateLiability(id, liabilityData);
      res.json(updatedLiability);
    } catch (error) {
      console.error("Error updating liability:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update liability" });
    }
  });

  apiRouter.delete("/liabilities/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingLiability = await storage.getLiability(id);
      
      if (!existingLiability) {
        return res.status(404).json({ message: "Liability not found" });
      }
      
      // Check if the liability belongs to the authenticated user
      if (existingLiability.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteLiability(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting liability:", error);
      res.status(500).json({ message: "Failed to delete liability" });
    }
  });

  // Payments routes
  apiRouter.get("/payments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const payments = await storage.getAllPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error getting payments:", error);
      res.status(500).json({ message: "Failed to get payments" });
    }
  });

  apiRouter.get("/payments/upcoming", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const days = parseInt(req.query.days as string) || 30; // Default to 30 days
      const payments = await storage.getUpcomingPayments(userId, days);
      res.json(payments);
    } catch (error) {
      console.error("Error getting upcoming payments:", error);
      res.status(500).json({ message: "Failed to get upcoming payments" });
    }
  });

  apiRouter.post("/payments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        userId // Ensure the payment is associated with the authenticated user
      });
      
      const newPayment = await storage.createPayment(paymentData);
      res.status(201).json(newPayment);
    } catch (error) {
      console.error("Error creating payment:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  apiRouter.patch("/payments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingPayment = await storage.getPayment(id);
      
      if (!existingPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Check if the payment belongs to the authenticated user
      if (existingPayment.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        userId // Maintain the user association
      });
      
      const updatedPayment = await storage.updatePayment(id, paymentData);
      res.json(updatedPayment);
    } catch (error) {
      console.error("Error updating payment:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  apiRouter.delete("/payments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingPayment = await storage.getPayment(id);
      
      if (!existingPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Check if the payment belongs to the authenticated user
      if (existingPayment.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deletePayment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  // Financial Goals routes
  apiRouter.get("/goals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const goals = await storage.getAllFinancialGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error getting financial goals:", error);
      res.status(500).json({ message: "Failed to get financial goals" });
    }
  });
  
  apiRouter.get("/goals/type/:type", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const type = req.params.type;
      const goals = await storage.getFinancialGoalsByType(userId, type);
      res.json(goals);
    } catch (error) {
      console.error("Error getting financial goals by type:", error);
      res.status(500).json({ message: "Failed to get financial goals by type" });
    }
  });
  
  apiRouter.get("/goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const goal = await storage.getFinancialGoal(id);
      
      if (!goal) {
        return res.status(404).json({ message: "Financial goal not found" });
      }
      
      // Check if the goal belongs to the authenticated user
      if (goal.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(goal);
    } catch (error) {
      console.error("Error getting financial goal:", error);
      res.status(500).json({ message: "Failed to get financial goal" });
    }
  });
  
  apiRouter.post("/goals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const goalData = insertFinancialGoalSchema.parse({
        ...req.body,
        userId // Ensure the goal is associated with the authenticated user
      });
      
      const newGoal = await storage.createFinancialGoal(goalData);
      res.status(201).json(newGoal);
    } catch (error) {
      console.error("Error creating financial goal:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create financial goal" });
    }
  });
  
  apiRouter.patch("/goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingGoal = await storage.getFinancialGoal(id);
      
      if (!existingGoal) {
        return res.status(404).json({ message: "Financial goal not found" });
      }
      
      // Check if the goal belongs to the authenticated user
      if (existingGoal.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedGoal = await storage.updateFinancialGoal(id, req.body);
      res.json(updatedGoal);
    } catch (error) {
      console.error("Error updating financial goal:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update financial goal" });
    }
  });
  
  apiRouter.patch("/goals/:id/progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingGoal = await storage.getFinancialGoal(id);
      
      if (!existingGoal) {
        return res.status(404).json({ message: "Financial goal not found" });
      }
      
      // Check if the goal belongs to the authenticated user
      if (existingGoal.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      if (!req.body.currentAmount && typeof req.body.currentAmount !== 'number') {
        return res.status(400).json({ message: "Current amount is required" });
      }
      
      const updatedGoal = await storage.updateGoalProgress(
        id, 
        Number(req.body.currentAmount)
      );
      
      res.json(updatedGoal);
    } catch (error) {
      console.error("Error updating financial goal progress:", error);
      res.status(500).json({ message: "Failed to update financial goal progress" });
    }
  });
  
  apiRouter.patch("/goals/:id/complete", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingGoal = await storage.getFinancialGoal(id);
      
      if (!existingGoal) {
        return res.status(404).json({ message: "Financial goal not found" });
      }
      
      // Check if the goal belongs to the authenticated user
      if (existingGoal.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const completedGoal = await storage.completeGoal(id);
      res.json(completedGoal);
    } catch (error) {
      console.error("Error completing financial goal:", error);
      res.status(500).json({ message: "Failed to complete financial goal" });
    }
  });
  
  apiRouter.delete("/goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingGoal = await storage.getFinancialGoal(id);
      
      if (!existingGoal) {
        return res.status(404).json({ message: "Financial goal not found" });
      }
      
      // Check if the goal belongs to the authenticated user
      if (existingGoal.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteFinancialGoal(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting financial goal:", error);
      res.status(500).json({ message: "Failed to delete financial goal" });
    }
  });

  // AI Chat endpoints
  apiRouter.post("/chat", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      const userId = (req.user as Express.User).id;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request format. 'messages' array is required." 
        });
      }
      
      // Check if this is a request to update portfolio value
      const userMessage = messages.find(m => m.role === 'user')?.content;
      if (userMessage && typeof userMessage === 'string') {
        // Check for portfolio value update requests by pattern matching
        const portfolioValueRegex = /(change|update|set|make)\s+(my\s+)?(portfolio|investment|total)\s+(value|worth)\s+to\s+\$?([0-9,.]+)(\s?[m|M|b|B|k|K])?/i;
        const portfolioValueMatch = userMessage.match(portfolioValueRegex);
        
        if (portfolioValueMatch) {
          try {
            // Extract the value from the regex match
            let valueStr = portfolioValueMatch[5].replace(/,/g, '');
            let multiplier = 1;
            
            // Check for million/billion/thousand suffix
            const suffix = portfolioValueMatch[6]?.trim().toLowerCase();
            if (suffix === 'm') multiplier = 1000000;
            else if (suffix === 'b') multiplier = 1000000000;
            else if (suffix === 'k') multiplier = 1000;
            
            const numericValue = parseFloat(valueStr) * multiplier;
            
            // Return a specific response for portfolio value update requests
            return res.json({
              success: true,
              data: {
                choices: [{
                  message: {
                    content: `I understand you want to update your portfolio value to $${numericValue.toLocaleString()}. However, I can't directly change your total portfolio value because it's calculated based on your individual investments. Would you like me to help you adjust specific investments or add new ones to reach your target portfolio value?`
                  }
                }]
              }
            });
          } catch (err) {
            console.error("Error parsing portfolio value request:", err);
          }
        }
      }
      
      // If not a portfolio value update request, proceed with normal chat
      const response = await getChatCompletion(messages);
      res.json(response);
    } catch (error) {
      console.error("Error processing chat request:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process chat request", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  apiRouter.post("/chat/analyze-portfolio", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request format. 'query' string is required." 
        });
      }
      
      // Gather financial data for the authenticated user
      const investments = await storage.getAllInvestments(userId);
      const portfolioSummary = await storage.getPortfolioSummary(userId);
      const assetAllocation = await storage.getAssetAllocation(userId);
      const recentActivities = await storage.getRecentActivities(5, userId);
      
      // Combine data for analysis
      const financialData = {
        investments,
        portfolioSummary,
        assetAllocation,
        recentActivities
      };
      
      const response = await analyzeFinancialData(financialData, query);
      res.json(response);
    } catch (error) {
      console.error("Error analyzing portfolio:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to analyze portfolio", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Process natural language input to extract financial data
  apiRouter.post("/chat/process-natural-language", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { input } = req.body;
      
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request format. 'input' string is required." 
        });
      }
      
      const processedData = await processNaturalLanguageInput(input);
      
      if (!processedData) {
        return res.status(500).json({
          success: false,
          message: "Failed to process natural language input"
        });
      }
      
      res.json({
        success: true,
        data: processedData
      });
    } catch (error) {
      console.error("Error processing natural language input:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process natural language input", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Process spreadsheet data
  apiRouter.post("/chat/process-spreadsheet", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { fileData, fileName } = req.body;
      
      if (!fileData || typeof fileData !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request format. 'fileData' is required as a base64 string." 
        });
      }
      
      console.log(`Processing spreadsheet: ${fileName || 'unnamed'} (${fileData.substring(0, 50)}...)`);
      
      // Parse the spreadsheet data
      // This is a simplified example - in reality, you would need to actually parse the data
      // using a library like xlsx or parse-csv
      const spreadsheetData = {
        fileName: fileName || 'spreadsheet.xlsx',
        data: fileData.substring(0, 1000), // Just use a portion for demo purposes
        type: fileName?.endsWith('.csv') ? 'csv' : 'xlsx'
      };
      
      const processedData = await processSpreadsheetData(spreadsheetData);
      
      if (!processedData) {
        return res.status(500).json({
          success: false,
          message: "Failed to process spreadsheet data"
        });
      }
      
      res.json({
        success: true,
        data: processedData
      });
    } catch (error) {
      console.error("Error processing spreadsheet data:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process spreadsheet data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Save processed financial data after user approval
  apiRouter.post("/chat/save-processed-data", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const { type, items } = req.body;
      
      if (!type || !items || !Array.isArray(items)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request format. 'type' and 'items' array are required." 
        });
      }
      
      let savedItems = [];
      
      // Process based on data type
      switch (type) {
        case 'investment':
          for (const item of items) {
            const investmentData = {
              ...item,
              userId
            };
            
            // If costBasis is not provided, calculate it from price and quantity
            if (!investmentData.costBasis && investmentData.price && investmentData.quantity) {
              investmentData.costBasis = investmentData.price * investmentData.quantity;
            }
            
            const newInvestment = await storage.createInvestment(investmentData);
            savedItems.push(newInvestment);
            
            // Create a BUY activity for this investment
            const activityData = {
              type: "BUY" as const,
              userId,
              investmentId: newInvestment.id,
              investmentName: newInvestment.name,
              amount: newInvestment.price * newInvestment.quantity,
              quantity: newInvestment.quantity,
              price: newInvestment.price,
              description: `Added ${newInvestment.quantity} ${newInvestment.type === 'Crypto' ? newInvestment.symbol : (newInvestment.type === 'Stock' || newInvestment.type === 'ETF' ? 'shares of ' : 'units of ')}${newInvestment.name}`,
              date: new Date(),
            };
            
            await storage.createActivity(activityData);
          }
          break;
          
        case 'expense':
          for (const item of items) {
            const budgetItemData = {
              ...item,
              userId
            };
            const newBudgetItem = await storage.createBudgetItem(budgetItemData);
            savedItems.push(newBudgetItem);
          }
          break;
          
        case 'liability':
          for (const item of items) {
            const liabilityData = {
              ...item,
              userId
            };
            const newLiability = await storage.createLiability(liabilityData);
            savedItems.push(newLiability);
          }
          break;
          
        case 'payment':
          for (const item of items) {
            const paymentData = {
              ...item,
              userId
            };
            const newPayment = await storage.createPayment(paymentData);
            savedItems.push(newPayment);
          }
          break;
          
        case 'goal':
          for (const item of items) {
            const goalData = {
              ...item,
              userId
            };
            const newGoal = await storage.createFinancialGoal(goalData);
            savedItems.push(newGoal);
          }
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid data type. Must be one of: investment, expense, liability, payment, goal"
          });
      }
      
      res.json({
        success: true,
        message: `Successfully saved ${savedItems.length} ${type} items`,
        data: savedItems
      });
    } catch (error) {
      console.error("Error saving processed data:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          success: false, 
          message: validationError.message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Failed to save processed data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Financial Notes endpoints
  apiRouter.get("/notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const notes = await storage.getAllFinancialNotes(userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get("/notes/category/:category", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const category = req.params.category;
      const notes = await storage.getFinancialNotesByCategory(userId, category);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.get("/notes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const note = await storage.getFinancialNote(id);
      
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      if (note.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to access this note" });
      }

      res.json(note);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post("/notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const { insertFinancialNoteSchema } = await import("@shared/schema");
      
      const noteData = insertFinancialNoteSchema.parse({
        ...req.body,
        userId
      });
      
      const note = await storage.createFinancialNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          error: validationError.message 
        });
      }
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.patch("/notes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingNote = await storage.getFinancialNote(id);
      
      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      if (existingNote.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this note" });
      }
      
      const updatedNote = await storage.updateFinancialNote(id, req.body);
      res.json(updatedNote);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.delete("/notes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const id = parseInt(req.params.id);
      const existingNote = await storage.getFinancialNote(id);
      
      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      if (existingNote.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this note" });
      }
      
      await storage.deleteFinancialNote(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat API endpoints
  apiRouter.post("/chat", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check for messages array
      if (!req.body || (!req.body.messages && !req.body.message)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request format. Please include a 'messages' array or 'message' field." 
        });
      }

      const userId = (req.user as Express.User).id;
      
      // Handle both message formats (single message or array of messages)
      let messages = [];
      if (req.body.messages && Array.isArray(req.body.messages)) {
        messages = req.body.messages;
        console.log("Received messages array:", messages.length, "messages");
      } else if (req.body.message) {
        // Legacy support for old client format
        messages = [{ role: "user", content: req.body.message }];
        console.log("Received single message:", req.body.message.substring(0, 50) + "...");
      }
      
      // Get user context data for chat
      const portfolioSummary = await storage.getPortfolioSummary(userId);
      const budgetItems = await storage.getAllBudgetItems(userId);
      const liabilities = await storage.getAllLiabilities(userId);
      const investments = await storage.getAllInvestments(userId);
      
      // Basic user context for the AI
      const userContext = {
        portfolio: portfolioSummary,
        budget: budgetItems,
        liabilities: liabilities,
        investments: investments
      };
      
      // Prepare messages for OpenAI API
      const systemMessage = {
        role: "system",
        content: `You are Sidekick, a financial assistant. You have access to the user's financial data.
        Respond in a helpful and personalized way. If the user asks about specific financial data, refer to it precisely.
        If the user asks to make changes to their data, explain what changes would be made but don't actually make them - 
        instead recommend they use the natural language commands like "Add rent $1500 to my March 2025 budget".`
      };
      
      // Find the last user message to augment with context
      const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf("user");
      
      if (lastUserMessageIndex !== -1) {
        // Clone the messages array to avoid modifying the original
        const augmentedMessages = [...messages];
        
        // Add context to the last user message
        const lastUserMessage = augmentedMessages[lastUserMessageIndex];
        augmentedMessages[lastUserMessageIndex] = {
          ...lastUserMessage,
          content: `My financial data: ${JSON.stringify(userContext)}\n\nMy question is: ${lastUserMessage.content}`
        };
        
        // Add system message at the beginning if not present
        if (!augmentedMessages.some(m => m.role === "system")) {
          augmentedMessages.unshift(systemMessage);
        }
        
        console.log("Sending", augmentedMessages.length, "messages to OpenAI");
        
        // Get response from GPT with all messages
        const response = await getChatCompletion(augmentedMessages);
        
        if (!response.success) {
          return res.status(500).json({
            success: false,
            message: "Failed to get chat response",
            error: response.error
          });
        }
        
        return res.json({
          success: true,
          data: response.data
        });
      } else {
        // No user message found in the array, use the traditional approach
        console.log("No user message found in array, using traditional approach");
        
        const response = await getChatCompletion([
          systemMessage,
          {
            role: "user",
            content: `My financial data: ${JSON.stringify(userContext)}\n\nMy question is: ${
              messages.length > 0 && typeof messages[0].content === 'string' 
                ? messages[0].content 
                : "What is the state of my finances?"
            }`
          }
        ]);
        
        if (!response.success) {
          return res.status(500).json({
            success: false,
            message: "Failed to get chat response",
            error: response.error
          });
        }
        
        return res.json({
          success: true,
          data: response.data
        });
      }
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error processing chat message",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Process natural language input for data operations
  apiRouter.post("/chat/process-natural-language", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.body || !req.body.input) {
        return res.status(400).json({ success: false, message: "Invalid request format. Please include an 'input' field." });
      }
      
      const userId = (req.user as Express.User).id;
      const userInput = req.body.input;
      
      // Process the natural language input
      const processedData = await processNaturalLanguageInput(userInput);
      
      if (!processedData) {
        return res.json({
          success: true,
          isQuestion: true,
          message: "This appears to be a question rather than data to process."
        });
      }
      
      // Add the user ID to all items
      const itemsWithUserId = processedData.items.map(item => ({
        ...item,
        userId
      }));
      
      processedData.items = itemsWithUserId;
      
      return res.json({
        success: true,
        isQuestion: false,
        data: processedData
      });
    } catch (error) {
      console.error("Error processing natural language input:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error processing natural language input",
        error: error instanceof Error ? error.message : "Unknown error"  
      });
    }
  });
  
  // Process uploaded spreadsheet data
  apiRouter.post("/chat/process-spreadsheet", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.body || !req.body.data) {
        return res.status(400).json({ success: false, message: "Invalid request format. Please include a 'data' field." });
      }
      
      const userId = (req.user as Express.User).id;
      const spreadsheetData = req.body.data;
      
      // Process the spreadsheet data
      const processedData = await processSpreadsheetData(spreadsheetData);
      
      if (!processedData) {
        return res.status(500).json({ success: false, message: "Failed to process spreadsheet data" });
      }
      
      // Add the user ID to all items in all categories
      const dataWithUserId = processedData.map(category => ({
        ...category,
        items: category.items.map(item => ({
          ...item,
          userId
        }))
      }));
      
      return res.json({
        success: true,
        data: dataWithUserId
      });
    } catch (error) {
      console.error("Error processing spreadsheet data:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error processing spreadsheet data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Confirm and save processed data
  apiRouter.post("/chat/confirm-data", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.body || !req.body.data) {
        return res.status(400).json({ success: false, message: "Invalid request format. Please include a 'data' field." });
      }
      
      const userId = (req.user as Express.User).id;
      const { type, items } = req.body.data;
      
      // Process the data based on its type
      let savedItems = [];
      
      switch (type) {
        case 'investment':
          // Save each investment
          for (const item of items) {
            const newInvestment = await storage.createInvestment({
              ...item,
              userId
            });
            savedItems.push(newInvestment);
          }
          break;
          
        case 'expense':
          // Save each budget item
          for (const item of items) {
            const newBudgetItem = await storage.createBudgetItem({
              ...item,
              userId
            });
            savedItems.push(newBudgetItem);
          }
          break;
          
        case 'liability':
          // Save each liability
          for (const item of items) {
            const newLiability = await storage.createLiability({
              ...item,
              userId
            });
            savedItems.push(newLiability);
          }
          break;
          
        case 'payment':
          // Save each payment
          for (const item of items) {
            const newPayment = await storage.createPayment({
              ...item,
              userId
            });
            savedItems.push(newPayment);
          }
          break;
          
        case 'goal':
          // Save each financial goal
          for (const item of items) {
            const newGoal = await storage.createFinancialGoal({
              ...item,
              userId
            });
            savedItems.push(newGoal);
          }
          break;
          
        default:
          return res.status(400).json({ success: false, message: "Invalid data type" });
      }
      
      return res.json({
        success: true,
        message: `Successfully saved ${savedItems.length} ${type} items`,
        savedItems
      });
    } catch (error) {
      console.error("Error saving processed data:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error saving processed data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Market data endpoint - public, no auth required
  apiRouter.get("/market-data", async (req: Request, res: Response) => {
    try {
      const marketData = await getMarketData();
      res.json(marketData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });
  
  // Search for assets by name or symbol - public, no auth required
  apiRouter.get("/assets/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || '';
      const limit = parseInt(req.query.limit as string || '10');
      
      const { searchAssets } = await import('./market-data');
      const results = await searchAssets(query, limit);
      
      res.json(results);
    } catch (error) {
      console.error("Error searching assets:", error);
      res.status(500).json({ message: "Failed to search assets" });
    }
  });
  
  // Get details for a specific asset by symbol - public, no auth required
  apiRouter.get("/assets/:symbol", async (req: Request, res: Response) => {
    try {
      const symbol = req.params.symbol;
      
      const { getAssetDetails } = await import('./market-data');
      const asset = await getAssetDetails(symbol);
      
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      res.json(asset);
    } catch (error) {
      console.error(`Error getting asset details for ${req.params.symbol}:`, error);
      res.status(500).json({ message: "Failed to get asset details" });
    }
  });
  
  // Test auth route - requires authentication
  apiRouter.get("/auth-test", isAuthenticated, (req: Request, res: Response) => {
    const user = req.user as Express.User;
    res.json({
      message: "Authentication successful",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
      }
    });
  });
  
  // User profile update endpoint
  apiRouter.patch("/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { name, email, profileImage } = req.body;
      
      // Update the user profile
      const updatedUser = await storage.updateUser(userId, {
        name: name || undefined,
        email: email || undefined,
        profileImage: profileImage || undefined
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the user in the session
      req.user = updatedUser;
      
      // Return the updated user data
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Firebase authentication is handled in auth.ts to avoid duplicate endpoints

  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
