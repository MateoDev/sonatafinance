import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Bot, User, ChevronDown, ChevronUp } from 'lucide-react';
import QuickActionButtons from './QuickActionButtons';

// Define the structure of a chat message
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'You are a sophisticated financial advisor and portfolio analyst specializing in investment strategy. You can also help users add financial data through natural language processing. When users ask to add investments, expenses, goals, or other financial data, extract the necessary information and indicate you\'ll add it to the appropriate section.'
    },
    {
      role: 'assistant',
      content: 'Welcome to your Financial AI Advisor. I can help manage your finances by: \n\n• Adding new transactions or investments\n• Analyzing your spending patterns\n• Answering questions about your financial status\n• Suggesting improvements to your budget\n\nWhat would you like help with today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom on initial load
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Process input for potential financial data
  const processInputForFinancialData = async (message: string) => {
    try {
      // First, try to see if this is financial data entry
      const processResponse = await fetch('/api/chat/process-natural-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: message }),
      });
      
      const processData = await processResponse.json();
      
      // If the input was successfully interpreted as financial data
      if (processData.success && processData.data && processData.data.items && processData.data.items.length > 0) {
        // Add a loading assistant message that we'll replace
        const loadingMessage: Message = { 
          role: 'assistant', 
          content: 'Processing your financial data...' 
        };
        setMessages(prev => [...prev, loadingMessage]);
        
        // Save the processed data
        const saveResponse = await fetch('/api/chat/save-processed-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: processData.data.type,
            items: processData.data.items,
          }),
        });
        
        const saveData = await saveResponse.json();
        
        // Update the loading message with confirmation
        if (saveData.success) {
          const itemType = processData.data.type === 'investment' ? 'investment(s)' :
                        processData.data.type === 'expense' ? 'budget item(s)' :
                        processData.data.type === 'liability' ? 'liability(s)' :
                        processData.data.type === 'payment' ? 'payment(s)' :
                        processData.data.type === 'goal' ? 'financial goal(s)' : 'item(s)';
          
          const confirmMessage = `✅ I've added ${processData.data.items.length} ${itemType} based on your input:\n\n${processData.data.summary}\n\nThe data has been saved to your account.`;
          
          // Replace the loading message with confirmation
          setMessages(prev => prev.map((msg, i) => 
            i === prev.length - 1 ? { ...msg, content: confirmMessage } : msg
          ));
          
          return true; // Indicate we handled this as financial data
        } else {
          // Replace with error message
          setMessages(prev => prev.map((msg, i) => 
            i === prev.length - 1 ? { ...msg, content: `Error saving your data: ${saveData.error || 'Unknown error'}` } : msg
          ));
          return true;
        }
      }
      
      return false; // Not financial data, handle as regular chat
    } catch (error) {
      console.error('Error processing input as financial data:', error);
      return false; // Not handled, proceed with regular chat
    }
  };

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message to the chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // First check if this is financial data entry
      const isFinancialData = await processInputForFinancialData(input);
      
      // If it's not financial data, handle as regular chat
      if (!isFinancialData) {
        // Call the AI endpoint to get a response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        });

        const data = await response.json();
        
        if (data.success) {
          // Add AI response to the chat
          const assistantMessage: Message = {
            role: 'assistant',
            content: data.data.choices[0].message.content
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error(data.error || 'Failed to get AI response');
        }
      }
    } catch (error) {
      console.error('Error getting chat response:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response from AI',
        variant: 'destructive',
      });
      
      // Add error message to chat
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // Scroll to the bottom to show the latest message
      setTimeout(scrollToBottom, 100);
    }
  };

  // Handle inserting a quick action
  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    // Auto-focus the input field
    const inputElement = document.querySelector('input[placeholder="Ask about your portfolio..."]') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };

  // Handle pressing Enter key in the input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto max-w-3xl w-full">
      <Card className="flex flex-col h-[80vh] shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Financial AI Advisor</CardTitle>
              <CardDescription className="hidden md:block">
                Ask questions about your portfolio or add new financial data
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
        </CardHeader>
        
        {showSuggestions && (
          <div className="px-4 pt-1 pb-3 border-b">
            <QuickActionButtons onActionClick={handleQuickAction} />
          </div>
        )}
        
        <CardContent className="flex-grow overflow-auto pt-4">
          <div className="space-y-4 pb-2">
            {messages.filter(m => m.role !== 'system').map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex">
                    <div className="mr-2 mt-1">
                      {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className="whitespace-pre-line">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 border-t">
          <div className="flex items-center w-full gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your portfolio..."
              disabled={loading}
              className="flex-grow"
            />
            <Button onClick={handleSend} disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}