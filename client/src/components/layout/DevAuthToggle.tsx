import { useDevAuth } from "@/hooks/use-dev-auth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, GripVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";

/**
 * Development-only component for toggling auth bypass
 * This should be removed in production
 */
export function DevAuthToggle() {
  const { enableDevBypass, toggleDevBypass } = useDevAuth();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  
  // Don't render the toggle button on production sites
  const isProductionSite = window.location.hostname.includes('.replit.app');
  if (isProductionSite) return null;

  // Initialize position from localStorage if available
  useEffect(() => {
    const savedPosition = localStorage.getItem('devTogglePosition');
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch (e) {
        // If parsing fails, use default position
        setPosition({ x: 0, y: 0 });
      }
    } else {
      // Default position (bottom right)
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setPosition({ x: windowWidth - 120, y: windowHeight - 80 });
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('devTogglePosition', JSON.stringify(position));
    }
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep the button within the viewport
      const buttonWidth = buttonRef.current?.offsetWidth || 100;
      const buttonHeight = buttonRef.current?.offsetHeight || 60;
      const maxX = window.innerWidth - buttonWidth;
      const maxY = window.innerHeight - buttonHeight;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div 
      ref={buttonRef}
      className="fixed p-3 bg-red-500 bg-opacity-90 text-white rounded-lg shadow-lg z-50 flex flex-col items-center cursor-move"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        borderTop: isDragging ? '2px solid white' : 'none'
      }}
    >
      <div 
        className="text-xs font-bold mb-1 flex items-center" 
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="h-3 w-3 mr-1" />
        <Shield className="h-3 w-3 mr-1" />
        DEV MODE
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="dev-auth-toggle"
          checked={enableDevBypass}
          onCheckedChange={toggleDevBypass}
        />
        <Label htmlFor="dev-auth-toggle" className="text-xs">
          {enableDevBypass ? "Using Mock User" : "Real Auth"}
        </Label>
      </div>
    </div>
  );
}