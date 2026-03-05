import React, { useRef } from 'react';
import { useChat } from '@/hooks/use-chat-context';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Bot,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  Loader2,
  MessageCircle,
  Send,
  Upload,
  User,
  X
} from 'lucide-react';
import { SonataIcon, SonataBubbleIcon } from '@/components/ui/sonata-icon';
import { timeAgo } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QuickAction } from '@/hooks/use-chat-context';

// Quick actions for the chat
const quickActions: QuickAction[] = [
  {
    id: 'add-budget-items',
    label: 'Add Budget Items',
    prompt: 'Add these items to my budget for March 2025: Rent $1,500, Groceries $400, Utilities $150',
    icon: <SonataIcon className="h-4 w-4" size={16} />
  },
  {
    id: 'add-investment',
    label: 'Add Investment',
    prompt: 'Add a new investment: 10 shares of AAPL at $180 per share',
    icon: <SonataIcon className="h-4 w-4" size={16} />
  },
  {
    id: 'add-liability',
    label: 'Add Liability',
    prompt: 'Add a new liability: Car loan $15,000 at 3.5% interest with $350 monthly payment',
    icon: <SonataIcon className="h-4 w-4" size={16} />
  },
  {
    id: 'budget-analysis',
    label: 'Budget Analysis',
    prompt: 'Analyze my budget and suggest areas where I can save money',
    icon: <SonataIcon className="h-4 w-4" size={16} />
  }
];

export const FloatingChatPanel: React.FC = () => {
  const {
    messages,
    addMessage,
    sendMessage,
    isProcessing,
    inputValue,
    setInputValue,
    messagesEndRef,
    processedData,
    isAwaitingConfirmation,
    confirmProcessedData,
    cancelProcessedData,
    uploadFile,
    isUploading,
    fileName,
    isMinimized,
    toggleMinimize
  } = useChat();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset the input
    if (e.target.value) e.target.value = '';
  };
  
  // Handle quick action selection
  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt);
    sendMessage(action.prompt);
  };
  
  // Render a chat message
  const renderMessage = (message: typeof messages[0]) => {
    const isUser = message.role === 'user';
    
    if (message.role === 'system') return null;
    
    return (
      <div
        key={message.id}
        className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4 relative`}
      >
        <div className="flex items-center mb-1 text-xs text-neutral-500">
          <span className="mr-1">{isUser ? 'You' : 'Sidekick'}</span>
          <Clock className="h-3 w-3 mr-1" />
          <span>{timeAgo(message.timestamp)}</span>
        </div>
        
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[85%]`}>
          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center 
            ${isUser ? 'bg-primary/10 text-primary' : 'bg-neutral-200 text-neutral-700'}`}
          >
            {isUser ? <User className="h-4 w-4" /> : <SonataIcon className="h-4 w-4" size={16} />}
          </div>
          
          <div
            className={`py-2 px-3 rounded-lg ${
              isUser 
                ? 'bg-primary text-white' 
                : message.isError 
                  ? 'bg-destructive/10 text-destructive border border-destructive/20'
                  : 'bg-neutral-100 text-neutral-800'
            }`}
          >
            {message.isPending ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Thinking...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleMinimize}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <SonataBubbleIcon className="h-6 w-6 text-primary" size={24} />
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 sm:p-6 md:w-[420px] w-full max-h-[90vh]">
      <Card className="shadow-xl border-neutral-200 overflow-hidden">
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 border-b">
          <div className="flex items-center">
            <SonataIcon className="h-5 w-5 mr-2 text-primary" size={20} />
            <h3 className="font-medium">Sidekick</h3>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={toggleMinimize}>
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMinimize}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col h-[500px]">
          {/* Quick actions */}
          <div className="flex gap-2 p-3 border-b bg-neutral-50 overflow-x-auto hide-scrollbar">
            {quickActions.map(action => (
              <TooltipProvider key={action.id} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap text-xs bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action.icon}
                      <span className="ml-1.5">{action.label}</span>
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
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Data confirmation UI */}
          {isAwaitingConfirmation && processedData && (
            <div className="p-3 bg-primary/5 border-t border-b">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Review Data Before Saving</span>
                </div>
                
                <p className="text-xs text-neutral-600">
                  I've extracted {processedData.items.length} {processedData.type} items with {Math.round(processedData.confidence * 100)}% confidence.
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white"
                    onClick={confirmProcessedData}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Save Data
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={cancelProcessedData}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-3 pt-2 border-t flex items-end">
          <div className="grid w-full gap-2">
            {/* File upload */}
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isProcessing}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                />
                {fileName && (
                  <span className="text-xs text-neutral-500 self-center">{fileName}</span>
                )}
              </div>
            </div>
            
            {/* Input area */}
            <div className="flex gap-2">
              {inputValue.length > 100 ? (
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your question..."
                  className="resize-none min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
                      e.preventDefault();
                      sendMessage(inputValue);
                    }
                  }}
                  disabled={isProcessing || isUploading}
                />
              ) : (
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your question..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isProcessing) {
                      e.preventDefault();
                      sendMessage(inputValue);
                    }
                  }}
                  disabled={isProcessing || isUploading}
                />
              )}
              <Button
                className="flex-shrink-0 bg-neutral-900 hover:bg-neutral-800 text-white"
                size="icon"
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isProcessing || isUploading}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};