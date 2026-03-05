import { Express, Request, Response } from 'express';
import { hashPassword } from './auth';
import { storage } from './storage';

// This file provides developer-specific authentication routes for easier local development

export async function ensureDevUser() {
  try {
    // Check if dev user exists
    const existingUser = await storage.getUserByUsername('developer');
    
    if (existingUser) {
      console.log('Developer user already exists with ID:', existingUser.id);
      
      // Check if this user has any data - if not, create test data
      if (process.env.NODE_ENV === 'development') {
        await ensureDevUserHasTestData(existingUser.id);
      }
      
      return existingUser;
    }
    
    // Create a new dev user
    const hashedPassword = await hashPassword('developer');
    
    const newUser = await storage.createUser({
      username: 'developer',
      password: hashedPassword,
      name: 'Developer User',
      email: 'dev@example.com',
      profileImage: ""
    });
    
    // Update Firebase info separately
    await storage.updateUserFirebaseInfo(
      newUser.id,
      'developer-uid',
      true,
      ""
    );
    
    // Set up initial test data for the developer user
    if (process.env.NODE_ENV === 'development') {
      await ensureDevUserHasTestData(newUser.id);
    }
    
    console.log('Created new developer user with ID:', newUser.id);
    return newUser;
  } catch (error) {
    console.error('Failed to ensure developer user exists:', error);
    throw error;
  }
}

// Function to ensure the developer user has test data for better experience
async function ensureDevUserHasTestData(userId: number) {
  try {
    // Check if user already has investments
    const existingInvestments = await storage.getAllInvestments(userId);
    
    if (existingInvestments.length === 0) {
      console.log('Creating test investment data for developer user');
      
      // Create sample investments for various asset classes
      const sampleInvestments = [
        {
          userId,
          name: "S&P 500 ETF",
          type: "ETF" as const,
          category: "Stocks/Bonds/ETFs" as const,
          price: 550.64,
          quantity: 450,
          costBasis: 210000.00,
          symbol: "SPY",
          logoColor: "blue",
          logoInitial: "S",
          notes: "Core ETF holding"
        },
        {
          userId,
          name: "Growth Stock Fund",
          type: "ETF" as const,
          category: "IRA/Retirement" as const,
          price: 120.75,
          quantity: 1500,
          costBasis: 150000.00,
          symbol: "FDGRX",
          logoColor: "purple",
          logoInitial: "G",
          notes: "Growth-oriented mutual fund"
        },
        {
          userId,
          name: "Corporate Bond ETF",
          type: "Bond" as const,
          category: "Stocks/Bonds/ETFs" as const,
          price: 110.42,
          quantity: 1250,
          costBasis: 145000.00,
          symbol: "LQD",
          logoColor: "green",
          logoInitial: "B",
          notes: "Fixed income allocation"
        },
        {
          userId,
          name: "Bitcoin",
          type: "Crypto" as const,
          category: "Crypto" as const,
          price: 94500.00,
          quantity: 1.25,
          costBasis: 80000.00,
          symbol: "BTC",
          logoColor: "amber",
          logoInitial: "B",
          notes: "Digital asset allocation"
        }
      ];
      
      for (const investment of sampleInvestments) {
        await storage.createInvestment(investment);
      }
      
      // Create sample liabilities
      const sampleLiabilities = [
        {
          userId,
          name: "Mortgage",
          type: "Mortgage" as const,
          amount: 450000.00,
          interestRate: 4.25,
          minimumPayment: 2200.00,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          isCompleted: false,
          notes: "Primary residence mortgage"
        },
        {
          userId,
          name: "Auto Loan",
          type: "Auto Loan" as const,
          amount: 25000.00,
          interestRate: 3.75,
          minimumPayment: 450.00,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          isCompleted: false,
          notes: "Car loan"
        },
        {
          userId,
          name: "Student Loan",
          type: "Student Loan" as const,
          amount: 35000.00,
          interestRate: 5.5,
          minimumPayment: 380.00,
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
          isCompleted: false,
          notes: "Federal student loan"
        }
      ];
      
      for (const liability of sampleLiabilities) {
        await storage.createLiability(liability);
      }
      
      // Create sample budget items
      const currentMonth = new Date();
      const sampleBudgetItems = [
        {
          userId,
          name: "Monthly Rent",
          category: "Housing" as const,
          amount: 3000.00,
          date: currentMonth,
          isRecurring: true,
          recurrenceFrequency: "monthly",
          notes: "Rent and utilities"
        },
        {
          userId,
          name: "Transportation",
          category: "Transportation" as const,
          amount: 500.00,
          date: currentMonth,
          isRecurring: true,
          recurrenceFrequency: "monthly",
          notes: "Gas, car insurance, maintenance"
        },
        {
          userId,
          name: "Groceries",
          category: "Food" as const,
          amount: 800.00,
          date: currentMonth,
          isRecurring: true,
          recurrenceFrequency: "monthly",
          notes: "Groceries and dining out"
        },
        {
          userId,
          name: "Entertainment",
          category: "Entertainment" as const,
          amount: 300.00,
          date: currentMonth,
          isRecurring: true,
          recurrenceFrequency: "monthly",
          notes: "Streaming services, events"
        }
      ];
      
      for (const budgetItem of sampleBudgetItems) {
        await storage.createBudgetItem(budgetItem);
      }
      
      console.log('Test data created successfully for developer user');
    } else {
      console.log('Developer user already has investment data, skipping test data creation');
    }
  } catch (error) {
    console.error('Error creating test data for developer user:', error);
    // Don't throw here - we don't want to block login if test data creation fails
  }
}

export function setupDevAuth(app: Express) {
  // Always enable developer auth for now, since we're still in development
  // In production, this can be restricted with process.env.NODE_ENV === 'production'
  app.post('/api/login/dev', async (req: Request, res: Response) => {
    try {
      // First logout any existing user
      if (req.isAuthenticated()) {
        console.log('Logging out existing user before dev login');
        req.logout(() => {
          console.log('User logged out successfully');
        });
      }
      
      // Ensure dev user exists
      const devUser = await ensureDevUser();
      
      // Always create fresh test data when doing a dev login
      console.log('Creating/refreshing test data for developer user');
      await ensureDevUserHasTestData(devUser.id);
      
      // Log in the dev user
      req.login(devUser, (err) => {
        if (err) {
          console.error('Error logging in dev user:', err);
          return res.status(500).json({ message: 'Failed to login developer user' });
        }
        
        console.log('Developer user logged in successfully with ID:', devUser.id);
        
        // Return a specific, consistent response
        return res.status(200).json({ 
          message: 'Developer login successful',
          user: {
            id: devUser.id,
            username: 'developer',
            name: 'Developer User',
            email: 'dev@example.com',
            emailVerified: true,
            role: 'developer'
          }
        });
      });
    } catch (error) {
      console.error('Developer login error:', error);
      return res.status(500).json({ message: 'Internal server error during developer login' });
    }
  });
  
  console.log('Developer authentication endpoints registered');
}