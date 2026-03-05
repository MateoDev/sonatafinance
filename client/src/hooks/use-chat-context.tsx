import { createContext, ReactNode, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ProcessedFinancialData } from '@/lib/types';

// Type definitions for chat messages
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isPending?: boolean;
  isError?: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

type ChatContextType = {
  messages: ChatMessage[];
  addMessage: (content: string, role: MessageRole, options?: { isPending?: boolean; isError?: boolean }) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  isProcessing: boolean;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  processedData: ProcessedFinancialData | null;
  setProcessedData: React.Dispatch<React.SetStateAction<ProcessedFinancialData | null>>;
  isAwaitingConfirmation: boolean;
  setIsAwaitingConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
  confirmProcessedData: () => Promise<void>;
  cancelProcessedData: () => void;
  uploadFile: (file: File) => Promise<void>;
  isUploading: boolean;
  fileData: any;
  fileName: string;
  isMinimized: boolean;
  toggleMinimize: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  // Get user from query client directly instead of useAuth hook
  const user = queryClient.getQueryData(['/api/user']);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Chat state
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
  const [isMinimized, setIsMinimized] = useState(true);
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [fileData, setFileData] = useState<any>(null);
  const [fileName, setFileName] = useState('');
  
  // Data processing states
  const [processedData, setProcessedData] = useState<ProcessedFinancialData | null>(null);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  
  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to add a new message
  const addMessage = (content: string, role: MessageRole, options?: { isPending?: boolean; isError?: boolean }) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      content,
      role,
      timestamp: new Date(),
      ...options
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };
  
  // Function to update an existing message
  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => 
      prev.map(message => 
        message.id === id ? { ...message, ...updates } : message
      )
    );
  };
  
  // Function to delete a message
  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(message => message.id !== id));
  };
  
  // Send a message to the AI
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Add the user message
    addMessage(content, 'user');
    
    // Clear input
    setInputValue('');
    
    // Add a pending message from the AI
    const pendingMessageId = addMessage('', 'assistant', { isPending: true });
    
    setIsProcessing(true);
    
    try {
      // First, check if the message is asking to process natural language input
      if (content.toLowerCase().includes('add') || 
          content.toLowerCase().includes('create') || 
          content.toLowerCase().includes('new')) {
        
        try {
          const nlpResponse = await apiRequest('POST', '/api/chat/process-natural-language', { input: content });
          const nlpData = await nlpResponse.json();
          
          if (nlpData.success && nlpData.data) {
            // Update the pending message with confirmation text
            updateMessage(pendingMessageId, { 
              content: `I found some financial information in your message. Here\'s what I extracted:
              
Type: ${nlpData.data.type}
Items: ${nlpData.data.items.length}
Confidence: ${Math.round(nlpData.data.confidence * 100)}%

${nlpData.data.summary}

Would you like me to add this to your ${nlpData.data.type} records?`,
              isPending: false
            });
            
            // Set the processed data for confirmation
            setProcessedData(nlpData.data);
            setIsAwaitingConfirmation(true);
            setIsProcessing(false);
            return;
          }
        } catch (error) {
          console.error('Error processing natural language:', error);
          // Continue to normal chat if NLP fails
        }
      }
      
      // Send the message to the chat API
      // Convert our ChatMessage objects to the format expected by the API
      const apiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add the current user message (without id and timestamp as the API doesn't need these)
      const response = await apiRequest('POST', '/api/chat', { 
        messages: [...apiMessages, { role: 'user', content }]
      });
      const data = await response.json();
      
      if (data.success) {
        // Update the pending message with the AI response
        updateMessage(pendingMessageId, { 
          content: data.data.choices[0].message.content,
          isPending: false 
        });
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      updateMessage(pendingMessageId, {
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        isPending: false,
        isError: true
      });
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Confirm and save processed data
  const confirmProcessedData = async () => {
    if (!processedData) return;
    
    try {
      setIsProcessing(true);
      
      const response = await apiRequest('POST', '/api/chat/save-processed-data', {
        type: processedData.type,
        items: processedData.items
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add confirmation message
        addMessage(`I've successfully added ${processedData.items.length} ${processedData.type} items to your records.`, 'assistant');
        
        // Refresh relevant data
        switch (processedData.type) {
          case 'investment':
            queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
            queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
            queryClient.invalidateQueries({ queryKey: ['/api/portfolio/allocation'] });
            queryClient.invalidateQueries({ queryKey: ['/api/portfolio/performance'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
            break;
          case 'expense':
            queryClient.invalidateQueries({ queryKey: ['/api/budget'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
            break;
          case 'liability':
            queryClient.invalidateQueries({ queryKey: ['/api/liabilities'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
            break;
          case 'payment':
            queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
            break;
          case 'goal':
            queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
            break;
        }
        
        // Force a re-render to ensure UI updates
        window.dispatchEvent(new CustomEvent('data-update', { 
          detail: { type: processedData.type, items: data.savedItems } 
        }));
        
        toast({
          title: 'Data Saved',
          description: `Successfully added ${processedData.items.length} ${processedData.type} items.`,
        });
      } else {
        throw new Error(data.message || 'Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      addMessage('I encountered an error saving your data. Please try again.', 'assistant', { isError: true });
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save data',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setIsAwaitingConfirmation(false);
      setProcessedData(null);
    }
  };
  
  // Cancel data processing
  const cancelProcessedData = () => {
    addMessage('No problem. I\'ve discarded the data. Is there anything else you would like help with?', 'assistant');
    setIsAwaitingConfirmation(false);
    setProcessedData(null);
  };
  
  // Upload and process a file
  const uploadFile = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    setFileName(file.name);
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result;
        
        // Add a message about the file
        addMessage(`I've uploaded a file: ${file.name}`, 'user');
        
        // Add a pending message from the AI
        const pendingMessageId = addMessage('', 'assistant', { isPending: true });
        
        // Process the file based on its type
        if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
          // Convert to base64 for sending to the server
          const base64Data = (fileContent as string).split(',')[1];
          
          // Set file data for the spreadsheet processor
          setFileData(base64Data);
          
          // Send to the server for processing
          const response = await apiRequest('POST', '/api/chat/process-spreadsheet', {
            fileName: file.name,
            fileData: base64Data
          });
          
          const data = await response.json();
          
          if (data.success && data.data) {
            // Update the pending message with results
            updateMessage(pendingMessageId, {
              content: `I\'ve analyzed your spreadsheet and found the following:
              
${data.data.map((item: ProcessedFinancialData) => `- ${item.items.length} ${item.type} records with ${Math.round(item.confidence * 100)}% confidence
  ${item.summary}
`).join('\n')}

Would you like me to add this data to your records?`,
              isPending: false
            });
            
            // Set the processed data for confirmation (just use the first one for now)
            if (data.data.length > 0) {
              setProcessedData(data.data[0]);
              setIsAwaitingConfirmation(true);
            }
          } else {
            throw new Error(data.message || 'Failed to process spreadsheet');
          }
        } else {
          updateMessage(pendingMessageId, {
            content: `I received your file (${file.name}), but I can only process spreadsheets (.xlsx or .csv) at the moment. Please upload a different file format.`,
            isPending: false
          });
        }
      } catch (error) {
        console.error('Error processing file:', error);
        addMessage('I encountered an error processing your file. Please try again with a different file.', 'assistant', { isError: true });
        
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to process file',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.onerror = () => {
      setIsUploading(false);
      toast({
        title: 'Error',
        description: 'Failed to read the file',
        variant: 'destructive',
      });
    };
    
    reader.readAsDataURL(file);
  };
  
  // Toggle chat panel minimize state
  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        addMessage,
        updateMessage,
        deleteMessage,
        sendMessage,
        isProcessing,
        inputValue,
        setInputValue,
        messagesEndRef,
        processedData,
        setProcessedData,
        isAwaitingConfirmation,
        setIsAwaitingConfirmation,
        confirmProcessedData,
        cancelProcessedData,
        uploadFile,
        isUploading,
        fileData,
        fileName,
        isMinimized,
        toggleMinimize
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}