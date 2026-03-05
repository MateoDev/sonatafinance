import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from './use-toast';
import { Investment } from '@/lib/types';

export type SearchResultItem = {
  id: number;
  name: string;
  description?: string;
  type: 'investment' | 'expense' | 'liability' | 'payment' | 'goal' | 'page';
  route: string;
};

// Simplified type definitions for search items
type BudgetItem = {
  id: number;
  category?: string;
  description?: string;
};

type Liability = {
  id: number;
  name?: string;
  description?: string;
};

type Goal = {
  id: number;
  name?: string;
  description?: string;
};

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Static pages for navigation
  const staticPages: SearchResultItem[] = [
    { id: -1, name: 'Dashboard', type: 'page', route: '/' },
    { id: -2, name: 'Budget', type: 'page', route: '/budget' },
    { id: -3, name: 'Investments', type: 'page', route: '/investments' },
    { id: -4, name: 'Liabilities', type: 'page', route: '/liabilities' },
    { id: -5, name: 'AI Financial Advisor', type: 'page', route: '/chat' },
    { id: -6, name: 'Financial Goals', type: 'page', route: '/goals' },
    { id: -7, name: 'Settings', type: 'page', route: '/settings' },
  ];

  // Get investments data for search
  const { data: investments = [] } = useQuery<Investment[]>({
    queryKey: ['/api/investments'],
    enabled: false, // Only load on demand
  });

  // Get budget data for search
  const { data: budgetItems = [] } = useQuery<BudgetItem[]>({ 
    queryKey: ['/api/budget'],
    enabled: false, // Only load on demand
  });

  // Get liabilities data for search
  const { data: liabilities = [] } = useQuery<Liability[]>({
    queryKey: ['/api/liabilities'],
    enabled: false, // Only load on demand
  });

  // Get goals data for search
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
    enabled: false, // Only load on demand
  });

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Filter static pages
      const matchingPages = staticPages.filter(page => 
        page.name.toLowerCase().includes(query.toLowerCase())
      );
      
      // Map investments to search results
      const matchingInvestments = investments
        .filter((inv: Investment) => 
          inv.name.toLowerCase().includes(query.toLowerCase()) || 
          inv.symbol.toLowerCase().includes(query.toLowerCase())
        )
        .map((inv: Investment) => ({
          id: inv.id,
          name: inv.name,
          description: inv.symbol,
          type: 'investment' as const,
          route: `/investments/${inv.id}`
        }));
      
      // Map budget items to search results
      const matchingBudgetItems = budgetItems
        .filter((item: BudgetItem) => 
          (item.category?.toLowerCase() || '').includes(query.toLowerCase()) ||
          (item.description?.toLowerCase() || '').includes(query.toLowerCase())
        )
        .map((item: BudgetItem) => ({
          id: item.id,
          name: item.category || 'Budget Item',
          description: item.description,
          type: 'expense' as const,
          route: `/budget/${item.id}`
        }));
      
      // Map liabilities to search results
      const matchingLiabilities = liabilities
        .filter((liability: Liability) => 
          (liability.name?.toLowerCase() || '').includes(query.toLowerCase()) ||
          (liability.description?.toLowerCase() || '').includes(query.toLowerCase())
        )
        .map((liability: Liability) => ({
          id: liability.id,
          name: liability.name || 'Liability',
          description: liability.description,
          type: 'liability' as const,
          route: `/liabilities/${liability.id}`
        }));
      
      // Map goals to search results
      const matchingGoals = goals
        .filter((goal: Goal) => 
          (goal.name?.toLowerCase() || '').includes(query.toLowerCase()) ||
          (goal.description?.toLowerCase() || '').includes(query.toLowerCase())
        )
        .map((goal: Goal) => ({
          id: goal.id,
          name: goal.name || 'Financial Goal',
          description: goal.description,
          type: 'goal' as const,
          route: `/goals/${goal.id}`
        }));
      
      // Combine all results
      const allResults = [
        ...matchingPages,
        ...matchingInvestments,
        ...matchingBudgetItems,
        ...matchingLiabilities,
        ...matchingGoals
      ];
      
      setResults(allResults);
    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: 'Search error',
        description: 'Failed to search. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const navigateToResult = (result: SearchResultItem) => {
    setLocation(result.route);
    // Clear search results
    setSearchQuery('');
    setResults([]);
  };

  return {
    searchQuery,
    results,
    isSearching,
    handleSearch,
    navigateToResult,
  };
}