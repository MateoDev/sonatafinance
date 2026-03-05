import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, LayoutDashboard, LineChart, Receipt, CreditCard, Target, MessageSquare } from 'lucide-react';
import { useSearch, SearchResultItem } from '@/hooks/use-search';

export default function SearchBar({ isMobile = false }) {
  const [isActive, setIsActive] = useState(false);
  const { searchQuery, results, isSearching, handleSearch, navigateToResult } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the search component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when activated
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'page':
        if (results.find(r => r.id === -1 && r.name === 'Dashboard')?.id === -1) return <LayoutDashboard className="h-4 w-4" />;
        if (results.find(r => r.id === -2 && r.name === 'Budget')?.id === -2) return <Receipt className="h-4 w-4" />;
        if (results.find(r => r.id === -3 && r.name === 'Investments')?.id === -3) return <LineChart className="h-4 w-4" />;
        if (results.find(r => r.id === -4 && r.name === 'Liabilities')?.id === -4) return <CreditCard className="h-4 w-4" />;
        if (results.find(r => r.id === -5 && r.name === 'AI Financial Advisor')?.id === -5) return <MessageSquare className="h-4 w-4" />;
        if (results.find(r => r.id === -6 && r.name === 'Financial Goals')?.id === -6) return <Target className="h-4 w-4" />;
        return <LayoutDashboard className="h-4 w-4" />;
      case 'investment':
        return <LineChart className="h-4 w-4" />;
      case 'expense':
        return <Receipt className="h-4 w-4" />;
      case 'liability':
        return <CreditCard className="h-4 w-4" />;
      case 'goal':
        return <Target className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearch(e.target.value);
  };

  const handleResultClick = (result: SearchResultItem) => {
    navigateToResult(result);
    setIsActive(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsActive(false);
    }
  };

  if (isMobile) {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input 
          ref={inputRef}
          type="text" 
          placeholder="Search..." 
          className="pl-10 w-full h-9 bg-neutral-50 border-neutral-200 focus:bg-white"
          value={searchQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => handleSearch('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {isActive && results.length > 0 && (
          <div 
            ref={resultsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border overflow-hidden z-50"
          >
            <div className="p-1 max-h-64 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-100 rounded flex items-start gap-2"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="mt-0.5 text-neutral-500">
                    {getIconForType(result.type)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{result.name}</div>
                    {result.description && (
                      <div className="text-xs text-neutral-500">{result.description}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        className={`flex items-center h-9 bg-neutral-50 border border-neutral-200 rounded-md overflow-hidden transition-all ${
          isActive ? 'w-64' : 'w-9 cursor-pointer'
        }`}
        onClick={() => !isActive && setIsActive(true)}
      >
        <div className="flex items-center justify-center w-9 text-neutral-400">
          <Search className="h-4 w-4" />
        </div>
        
        {isActive && (
          <Input 
            ref={inputRef}
            type="text" 
            placeholder="Search..." 
            className="flex-1 h-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            value={searchQuery}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        )}
        
        {isActive && searchQuery && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 mr-1"
            onClick={() => handleSearch('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isActive && results.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute top-full right-0 mt-1 w-64 bg-white rounded-md shadow-lg border overflow-hidden z-50"
        >
          <div className="p-1 max-h-64 overflow-y-auto">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                className="w-full text-left px-3 py-2 hover:bg-neutral-100 rounded flex items-start gap-2"
                onClick={() => handleResultClick(result)}
              >
                <div className="mt-0.5 text-neutral-500">
                  {getIconForType(result.type)}
                </div>
                <div>
                  <div className="font-medium text-sm">{result.name}</div>
                  {result.description && (
                    <div className="text-xs text-neutral-500">{result.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}