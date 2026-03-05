import OpenAI from "openai";

// Use environment variable for the API key
if (!process.env.OPENAI_API_KEY) {
  console.error("WARNING: OPENAI_API_KEY environment variable is not set. Chat functionality will not work properly.");
}

// Initialize OpenAI client (lazy — only crashes when actually called without key)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : (null as unknown as OpenAI);

// Define a type for our messages
type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Define a type for user intent
export type UserIntent = 'ADD' | 'UPDATE' | 'DELETE' | 'QUERY';

// Define a function to get completions from GPT-4o
export async function getChatCompletion(messages: ChatMessage[]) {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    // Make sure we only pass valid messages to the API
    const validMessages = messages.filter(m => 
      typeof m.role === 'string' && 
      ['system', 'user', 'assistant'].includes(m.role) && 
      typeof m.content === 'string'
    );
    
    // Add a system message if none exists
    if (!validMessages.some(m => m.role === 'system')) {
      validMessages.unshift({
        role: 'system',
        content: 'You are a financial assistant helping users manage their investments, budget, and financial goals.'
      });
    }
    
    console.log('Sending to OpenAI API:', JSON.stringify(validMessages.slice(0, 3) + '... (truncated)'));
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: validMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}

// Function to analyze financial data with AI
export async function analyzeFinancialData(financialData: any, query: string) {
  try {
    const messages: ChatMessage[] = [
      {
        role: "system", 
        content: `You are a financial advisor specializing in portfolio analysis. 
        You have access to the user's investment portfolio data. 
        Provide helpful, clear, and concise insights based on the data.
        Be professional but conversational, and focus on actionable advice.`
      },
      {
        role: "user",
        content: `Here is my current portfolio data: ${JSON.stringify(financialData)}\n\nMy question is: ${query}`
      }
    ];

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: 0.5,
      max_tokens: 1000,
    });

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error("Error analyzing financial data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}

// Types for the processed data
export type ProcessedFinancialData = {
  type: 'investment' | 'expense' | 'liability' | 'payment' | 'goal';
  items: any[]; // Will be structured based on schema
  summary: string;
  confidence: number;
};

// Function to process natural language financial data input
export async function processNaturalLanguageInput(input: string): Promise<ProcessedFinancialData | null> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial data extraction assistant helping to create, update, or query financial records in a personal finance app. 

Extract structured financial data from the user's natural language input by following these guidelines:

1. Categorize the data as one of these types:
   - investment: For stocks, ETFs, crypto, real estate or other investment assets
   - expense: For budget items and expenses
   - liability: For loans, credit cards, and other debts
   - payment: For scheduled bill payments
   - goal: For savings goals and financial targets

2. Extract all relevant fields depending on the type:
   - For investments: symbol, name, type, price, quantity, costBasis, notes
   - For expenses: category, amount, date, description, isRecurring, frequency
   - For liabilities: name, amount, interestRate, minimumPayment, dueDate, description
   - For payments: name, amount, dueDate, frequency, description
   - For goals: name, targetAmount, currentAmount, targetDate, priority, description

3. If the user is clearly asking a financial question rather than adding/modifying data, don't extract anything.

4. Ensure all numeric values are parsed as numbers, not strings.

5. When dates are mentioned:
   - If "today" is mentioned, use the current date
   - If "yesterday" is mentioned, use yesterday's date
   - If a day like "Monday" is mentioned, use the most recent Monday

Return your response as a JSON object with the following structure:
{
  "type": "investment|expense|liability|payment|goal",
  "items": [array of structured items with all extracted fields],
  "summary": "A brief summary of what was extracted",
  "confidence": 0.0-1.0 (how confident you are in the extraction)
}`
        },
        {
          role: "user",
          content: input
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // If confidence is too low or items array is empty, this might be a question rather than data entry
    if (result.confidence < 0.4 || !result.items || result.items.length === 0) {
      return null;
    }
    
    return result as ProcessedFinancialData;
  } catch (error) {
    console.error("Error processing natural language input:", error);
    return null;
  }
}

// Function to process spreadsheet data
export async function processSpreadsheetData(spreadsheetData: any): Promise<ProcessedFinancialData[] | null> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial data extraction assistant. Analyze the provided spreadsheet data and categorize entries into appropriate financial categories.
          For each category you identify, create a separate ProcessedFinancialData object.
          Return your response as a JSON array of objects, where each object has the following structure:
          {
            "type": "investment|expense|liability|payment|goal",
            "items": [array of structured items with all extracted fields],
            "summary": "A brief summary of what was extracted",
            "confidence": 0.0-1.0 (how confident you are in the extraction)
          }`
        },
        {
          role: "user",
          content: `Here is the spreadsheet data: ${JSON.stringify(spreadsheetData)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.categories as ProcessedFinancialData[];
  } catch (error) {
    console.error("Error processing spreadsheet data:", error);
    return null;
  }
}