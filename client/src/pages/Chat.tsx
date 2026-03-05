import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card,
  CardContent,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Loader2, 
  Bot, 
  User,
  Upload,
  FileSpreadsheet,
  Clock,
  Tag,
  BarChart3,
  DollarSign,
  Wallet
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { timeAgo } from '@/lib/utils';
import { ProcessedFinancialData } from '@/lib/types';
import ChangeComparison from '@/components/chat/ChangeComparison';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Type definitions for chat messages
type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isPending?: boolean;
  isError?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Message state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello${user?.name ? ' ' + user.name : ''}! I'm your financial assistant. You can ask me any questions about your finances, or I can help you add new data to your portfolio.`,
      timestamp: new Date(),
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [fileData, setFileData] = useState<any>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Data processing states
  const [processedData, setProcessedData] = useState<ProcessedFinancialData | null>(null);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  
  // Message container ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Quick action buttons
  const quickActions: QuickAction[] = [
    {
      id: 'budget-analysis',
      label: 'Budget Analysis',
      prompt: 'Analyze my budget for this month and suggest areas where I can save money.',
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      id: 'investment-recommendation',
      label: 'Investment Ideas',
      prompt: 'What investment opportunities should I consider with my current portfolio?',
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      id: 'expense-tracking',
      label: 'Add Expense',
      prompt: 'I spent $45 on groceries yesterday.',
      icon: <Tag className="h-4 w-4" />
    },
    {
      id: 'debt-strategy',
      label: 'Debt Strategy',
      prompt: "What's the best strategy to pay off my current debts?",
      icon: <Wallet className="h-4 w-4" />
    },
    {
      id: 'financial-goals',
      label: 'Financial Goals',
      prompt: 'Help me set a realistic savings goal for a house down payment.',
      icon: <Clock className="h-4 w-4" />
    }
  ];
  
  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Generate a unique ID for messages
  const generateId = () => {
    return Math.random().toString(36).substring(2, 11);
  };
  
  // Add a new message to the chat
  const addMessage = (role: MessageRole, content: string, options: any = {}) => {
    const newMessage: ChatMessage = {
      id: options.id || generateId(),
      role,
      content,
      timestamp: new Date(),
      isPending: options.isPending || false,
      isError: options.isError || false
    };
    
    setMessages(prev => [...prev, newMessage]);
  };
  
  // Update an existing message
  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    );
  };
  
  // Handle regular chat message processing
  const processChatMessage = async (message: string) => {
    try {
      // Add user message
      addMessage('user', message);
      
      // Add pending assistant message
      const pendingId = generateId();
      addMessage('assistant', '...', { id: pendingId, isPending: true });
      
      // Process the message with AI
      const response = await apiRequest('POST', '/api/chat', {
        messages: [{ role: 'user', content: message }]
      });
      
      // Check if the response was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        
        // Update the pending message with the error
        updateMessage(pendingId, {
          content: `I'm sorry, I couldn't process that request. ${
            message.toLowerCase().includes('portfolio value') ? 
            "To update your portfolio value, I need more specific information about which investments to adjust." : 
            "Please try rephrasing or use a different question."
          }`,
          isPending: false,
          isError: true
        });
        
        return false;
      }
      
      const data = await response.json();
      
      // Check if data has content property
      if (!data || !data.content) {
        updateMessage(pendingId, {
          content: "I'm sorry, I couldn't generate a response. Please try a different question.",
          isPending: false,
          isError: true
        });
        return false;
      }
      
      // Update the pending message with the actual response
      updateMessage(pendingId, {
        content: data.content,
        isPending: false
      });
      
      return true;
    } catch (error) {
      console.error("Error in processChatMessage:", error);
      
      // Find the pending message and update it to an error state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.isPending ? {
            ...msg,
            content: "Sorry, there was an error processing your request. Please try again.",
            isPending: false,
            isError: true
          } : msg
        )
      );
      
      toast({
        title: 'Error',
        description: 'Failed to process your message. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };
  
  // Process natural language input for financial data extraction
  const processNaturalLanguageInput = async (input: string) => {
    try {
      const response = await apiRequest('POST', '/api/chat/process-natural-language', {
        input
      });
      
      if (!response.ok) {
        // This might be a regular query, not a data extraction request
        console.log("Response not OK in natural language processing");
        return null;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        // Check if the response data is well-formed
        if (!data.data.items || !Array.isArray(data.data.items)) {
          console.log("Invalid data structure returned:", data);
          return null;
        }
        
        // If it's a request to update portfolio total value directly
        if (input.toLowerCase().includes("portfolio value") || 
            input.toLowerCase().includes("total portfolio") ||
            input.toLowerCase().includes("net worth")) {
          
          // Instead of trying to process as a financial data entry, return null
          // so it will be handled as a regular chat message
          return null;
        }
        
        return data.data as ProcessedFinancialData;
      }
      
      return null;
    } catch (error) {
      console.error('Error processing natural language input:', error);
      return null;
    }
  };
  
  // Process spreadsheet data
  const processSpreadsheetData = async (data: any) => {
    try {
      const response = await apiRequest('POST', '/api/chat/process-spreadsheet', {
        spreadsheetData: data
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data[0] as ProcessedFinancialData; // Just take the first category for now
      }
      
      return null;
    } catch (error) {
      console.error('Error processing spreadsheet data:', error);
      return null;
    }
  };
  
  // Save processed data after user confirmation
  const saveProcessedData = async (data: ProcessedFinancialData) => {
    try {
      const response = await apiRequest('POST', '/api/chat/save-processed-data', {
        type: data.type,
        items: data.items
      });
      
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `Added ${data.items.length} ${data.type} items to your portfolio.`,
      });
      
      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save data. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const file = e.target.files[0];
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target || typeof event.target.result !== 'string') {
          throw new Error('Failed to read file');
        }
        
        // For Excel/CSV files
        const fileContent = event.target.result;
        
        // In a real app, we would parse the Excel/CSV data properly
        // For now, we'll just use a simple mock of the parsed data
        const parsedData = {
          fileName: file.name,
          data: [
            { sheet: 'Sheet1', rows: fileContent.split('\n').slice(0, 10) }
          ]
        };
        
        setFileData(parsedData);
        
        // Add a user message about the upload
        addMessage('user', `I've uploaded a spreadsheet: ${file.name}`);
        
        // Process the data
        setIsProcessing(true);
        const pendingId = generateId();
        addMessage('assistant', 'Analyzing your spreadsheet data...', { id: pendingId, isPending: true });
        
        // In a real scenario, we would process the actual parsed data
        const processed = await processSpreadsheetData(parsedData);
        
        if (processed) {
          setProcessedData(processed);
          
          // Update the pending message
          updateMessage(pendingId, {
            content: `I've analyzed your spreadsheet and found ${processed.items.length} ${processed.type} items. ${processed.summary}`,
            isPending: false
          });
          
          // Show confirmation UI
          setIsAwaitingConfirmation(true);
        } else {
          // Update the pending message
          updateMessage(pendingId, {
            content: "I couldn't extract any meaningful financial data from this spreadsheet. Could you try uploading a different file?",
            isPending: false
          });
        }
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          title: 'Error',
          description: 'Failed to process the file. Please try a different file.',
          variant: 'destructive',
        });
        
        // Add error message
        addMessage('assistant', 'Sorry, I had trouble processing that file. Could you try a different format or file?', { isError: true });
      } finally {
        setIsUploading(false);
        setIsProcessing(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.onerror = () => {
      setIsUploading(false);
      toast({
        title: 'Error',
        description: 'Failed to read the file. Please try again.',
        variant: 'destructive',
      });
    };
    
    reader.readAsText(file);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    
    const userInput = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);
    
    try {
      // First, try to process as financial data
      const processedData = await processNaturalLanguageInput(userInput);
      
      if (processedData) {
        // This is financial data that can be saved
        setProcessedData(processedData);
        
        // Add user message
        addMessage('user', userInput);
        
        // Add assistant response
        addMessage('assistant', `I've extracted ${processedData.items.length} ${processedData.type} items from your message. ${processedData.summary}`);
        
        // Show confirmation UI
        setIsAwaitingConfirmation(true);
      } else {
        // Process as a regular chat message
        await processChatMessage(userInput);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle confirmation of data saving
  const handleConfirmSave = async () => {
    if (!processedData) return;
    
    try {
      setIsProcessing(true);
      
      // Add a pending message
      const pendingId = generateId();
      addMessage('assistant', 'Saving your data...', { id: pendingId, isPending: true });
      
      // Save the data
      await saveProcessedData(processedData);
      
      // Update the pending message
      updateMessage(pendingId, {
        content: `I've successfully saved your ${processedData.type} data to your portfolio!`,
        isPending: false
      });
      
      // Reset the confirmation state
      setIsAwaitingConfirmation(false);
      setProcessedData(null);
      
      // Optionally, suggest navigating to the relevant section
      const pageMap = {
        'investment': '/investments',
        'expense': '/budget',
        'liability': '/liabilities',
        'payment': '/liabilities',
        'goal': '/goals'
      };
      
      const targetPage = pageMap[processedData.type as keyof typeof pageMap];
      
      if (targetPage) {
        addMessage('assistant', `Would you like to view your ${processedData.type} data now? Just click [here](${targetPage}) to navigate.`);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle cancellation of data saving
  const handleCancelSave = () => {
    setIsAwaitingConfirmation(false);
    setProcessedData(null);
    addMessage('assistant', "I've cancelled saving the data. Is there anything else you'd like to do?");
  };
  
  // Handle clicking a quick action button
  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt);
  };
  
  // Render a chat message
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    // Simple markdown-like link parsing for navigation suggestions
    const parseContent = (content: string) => {
      // Safety check first to avoid "Cannot read properties of undefined"
      if (!content) {
        return '';
      }
      
      // Make sure content is a string
      const safeContent = String(content);
      
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = linkRegex.exec(safeContent)) !== null) {
        // Add text before the link
        if (match.index > lastIndex) {
          parts.push(safeContent.slice(lastIndex, match.index));
        }
        
        // Add the link
        const [, text, url] = match;
        parts.push(
          <Button
            key={url}
            variant="link"
            className="p-0 h-auto text-primary underline"
            onClick={() => setLocation(url)}
          >
            {text}
          </Button>
        );
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < safeContent.length) {
        parts.push(safeContent.slice(lastIndex));
      }
      
      return parts.length > 0 ? parts : safeContent;
    };
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUser ? 'ml-3' : 'mr-3'} ${isUser ? 'bg-primary' : 'bg-secondary'}`}>
            {isUser ? (
              <User className="h-5 w-5 text-primary-foreground" />
            ) : (
              <Bot className="h-5 w-5 text-secondary-foreground" />
            )}
          </div>
          
          <div>
            <div className={`rounded-xl px-4 py-3 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'} ${message.isError ? 'bg-destructive text-destructive-foreground' : ''}`}>
              {message.isPending ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{parseContent(message.content)}</div>
              )}
            </div>
            <div className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {timeAgo(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Removed redundant Header component */}
      <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          {/* Quick action buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            {quickActions.map(action => (
              <TooltipProvider key={action.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action.icon}
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.prompt}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto mb-4 pr-1">
            <div className="space-y-4">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Data confirmation UI */}
          {isAwaitingConfirmation && processedData && (
            <Card className="mb-4 border-primary/20">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-medium">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <span>Review Data Before Saving</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    I've extracted {processedData.items.length} {processedData.type} items. Please review before saving.
                  </p>
                  
                  <ChangeComparison items={processedData.items} type={processedData.type} />
                  
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={handleCancelSave}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmSave}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Data'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Input form */}
          <div className="mt-auto">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing || isUploading}
                  className="flex-shrink-0"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                
                <div className="relative flex-1">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me anything about your finances or enter data..."
                    className="min-h-[60px] resize-none pr-10"
                    disabled={isProcessing || isUploading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault(); // Prevent default to avoid new line
                        if (inputValue.trim() && !isProcessing) {
                          handleSubmit(e);
                        }
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputValue.trim() || isProcessing}
                    className="absolute right-2 bottom-2 h-6 w-6"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {fileName && (
                <p className="text-xs text-muted-foreground">
                  File: {fileName}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;