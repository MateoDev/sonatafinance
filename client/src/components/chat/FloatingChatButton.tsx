import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { SonataBubbleIcon } from '@/components/ui/sonata-icon';
import { useChat } from '@/hooks/use-chat-context';

const FloatingChatButton: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toggleMinimize } = useChat();
  
  // Don't show on auth page or already on chat page
  if (location === '/auth' || location === '/chat') {
    return null;
  }
  
  const handleClick = () => {
    toggleMinimize();
  };
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        onClick={handleClick}
        className="h-12 w-12 rounded-full shadow-lg"
        size="icon"
      >
        <SonataBubbleIcon className="h-6 w-6 text-primary" size={24} />
      </Button>
    </div>
  );
};

export default FloatingChatButton;