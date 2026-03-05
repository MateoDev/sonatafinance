import { storage } from '../server/storage';
import * as fs from 'fs';
import * as path from 'path';
import { InsertInvestment, InsertLiability, InsertBudgetItem, InsertFinancialGoal, InsertPayment } from '../shared/schema';

// Define the user email to add data to
const USER_EMAIL = 'matt.d.wright88@gmail.com';

// Path to processed data
const PROCESSED_DATA_PATH = path.resolve('./processed-finance-data.json');

async function importUserFinancialData() {
  try {
    // Load the processed financial data
    const rawData = fs.readFileSync(PROCESSED_DATA_PATH, 'utf8');
    const financialData = JSON.parse(rawData);
    
    console.log('Financial data loaded successfully from JSON file');
    
    // Get user ID from email
    const user = await storage.getUserByUsername(USER_EMAIL);
    
    if (!user) {
      console.error(`User with email ${USER_EMAIL} not found. Please create an account first.`);
      return;
    }
    
    console.log(`Found user account for ${USER_EMAIL} with ID: ${user.id}`);
    
    // Import investments from HOLDINGS sheet
    if (financialData.HOLDINGS && Array.isArray(financialData.HOLDINGS)) {
      console.log('Importing investments from HOLDINGS sheet...');
      
      // Filter out header rows and empty entries
      const validInvestments = financialData.HOLDINGS.filter((item: any) => 
        item['__EMPTY_1'] && // Account
        item['__EMPTY_3'] && // Quantity
        item['__EMPTY_6'] && // Current Value
        typeof item['__EMPTY_6'] === 'number' && 
        item['__EMPTY_6'] > 0
      );
      
      for (const investment of validInvestments) {
        const newInvestment: InsertInvestment = {
          userId: user.id,
          symbol: investment['__EMPTY_2'] || 'UNKNOWN',
          name: investment['__EMPTY_1'] || 'Unnamed Investment',
          type: investment['__EMPTY'] || 'Other',
          price: Number(investment['__EMPTY_6']) || 0,
          quantity: Number(investment['__EMPTY_3']) || 1,
          costBasis: Number(investment['__EMPTY_4']) || 0,
          notes: investment['__EMPTY_10'] || '',
        };
        
        await storage.createInvestment(newInvestment);
        console.log(`Added investment: ${newInvestment.name} - $${newInvestment.price}`);
      }
    }
    
    // Import budget items from BUDGET sheet
    if (financialData.BUDGET && Array.isArray(financialData.BUDGET)) {
      console.log('Importing budget items from BUDGET sheet...');
      
      // Filter out header rows and empty entries
      const validBudgetItems = financialData.BUDGET.filter((item: any) => 
        item['Categories'] && 
        typeof item['Categories'] === 'string' &&
        item['Categories'] !== 'Income' &&
        item['Categories'] !== 'Categories'
      );
      
      for (const budgetItem of validBudgetItems) {
        const newBudgetItem: InsertBudgetItem = {
          userId: user.id,
          category: budgetItem['Categories'] || 'Other',
          name: budgetItem['Categories'] || 'Unnamed Budget Item',
          amount: Number(budgetItem['__EMPTY_2']) || 0,
          period: 'monthly',
          createdAt: new Date().toISOString(),
        };
        
        if (newBudgetItem.amount > 0) {
          await storage.createBudgetItem(newBudgetItem);
          console.log(`Added budget item: ${newBudgetItem.name} - $${newBudgetItem.amount}/month`);
        }
      }
    }
    
    // Import liabilities from LIABILITIES sheet
    if (financialData.LIABILITIES && Array.isArray(financialData.LIABILITIES)) {
      console.log('Importing liabilities from LIABILITIES sheet...');
      
      // Filter out header rows and empty entries
      const validLiabilities = financialData.LIABILITIES.filter((item: any) => 
        item['Debt Consolidation'] && 
        typeof item['Debt Consolidation'] === 'string' &&
        item['Debt Consolidation'] !== 'Debt Consolidation' &&
        item['Debt Consolidation'] !== 'List all of your debts. Enter the balance you owe, annual interest rate, and required monthly payment for each.'
      );
      
      for (const liability of validLiabilities) {
        if (liability['__EMPTY_1'] && typeof liability['__EMPTY_1'] === 'number') {
          const newLiability: InsertLiability = {
            userId: user.id,
            name: liability['Debt Consolidation'] || 'Unnamed Debt',
            type: liability['__EMPTY'] || 'other',
            amount: Number(liability['__EMPTY_1']) || 0,
            interestRate: Number(liability['__EMPTY_2']) || 0,
            minimumPayment: Number(liability['__EMPTY_3']) || 0,
            dueDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
          
          if (newLiability.amount > 0) {
            await storage.createLiability(newLiability);
            console.log(`Added liability: ${newLiability.name} - $${newLiability.amount}`);
          }
        }
      }
    }
    
    // Import payment schedule from PAYMENT SCHEDULE sheet
    if (financialData['PAYMENT SCHEDULE'] && Array.isArray(financialData['PAYMENT SCHEDULE'])) {
      console.log('Importing payment schedule from PAYMENT SCHEDULE sheet...');
      
      // Filter out header rows and empty entries
      const validPayments = financialData['PAYMENT SCHEDULE'].filter((item: any) => 
        item['Payment Schedule'] && 
        typeof item['Payment Schedule'] === 'string' &&
        item['Payment Schedule'] !== 'Payment Schedule' &&
        item['Payment Schedule'] !== 'Investments'
      );
      
      for (const payment of validPayments) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const newPayment: InsertPayment = {
          userId: user.id,
          name: payment['Payment Schedule'] || 'Unnamed Payment',
          amount: Number(payment['__EMPTY_1']) || 0,
          dueDate: nextMonth.toISOString(),
          status: 'pending',
          category: payment['__EMPTY_4'] || 'other',
          recurring: true,
          createdAt: new Date().toISOString(),
        };
        
        if (newPayment.amount > 0) {
          await storage.createPayment(newPayment);
          console.log(`Added payment: ${newPayment.name} - $${newPayment.amount}`);
        }
      }
    }
    
    // Import financial goals from GOAL sheet
    if (financialData.GOAL && Array.isArray(financialData.GOAL)) {
      console.log('Importing financial goals from GOAL sheet...');
      
      // Filter out header rows and empty entries
      const validGoals = financialData.GOAL.filter((item: any) => 
        item['Categories'] && 
        typeof item['Categories'] === 'string' &&
        item['Categories'] !== 'Income' &&
        item['Categories'] !== 'Categories'
      );
      
      for (const goal of validGoals) {
        // Set target date 1 year from now
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + 1);
        
        const newGoal: InsertFinancialGoal = {
          userId: user.id,
          name: goal['Categories'] || 'Unnamed Goal',
          type: 'savings',
          targetAmount: Number(goal['__EMPTY_1']) || 10000,
          currentAmount: Number(goal['__EMPTY_2']) || 0,
          targetDate: targetDate.toISOString(),
          status: 'in_progress',
          createdAt: new Date().toISOString(),
        };
        
        if (newGoal.targetAmount > 0) {
          await storage.createFinancialGoal(newGoal);
          console.log(`Added financial goal: ${newGoal.name} - $${newGoal.targetAmount}`);
        }
      }
    }
    
    console.log('\nData import complete! 🎉');
    console.log(`Financial data has been added to account: ${USER_EMAIL}`);
    
  } catch (error) {
    console.error('Error importing financial data:', error);
  }
}

// Execute the import function
importUserFinancialData().then(() => {
  console.log('Import process finished');
}).catch(err => {
  console.error('Fatal error during import:', err);
});