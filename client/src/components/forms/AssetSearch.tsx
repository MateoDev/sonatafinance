import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Search, X } from 'lucide-react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface Asset {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
  price?: number;
}

interface AssetSearchProps {
  onSelect: (asset: Asset) => void;
  initialValue?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  customAssetEnabled?: boolean;
  className?: string;
}

export function AssetSearch({
  onSelect,
  initialValue = '',
  placeholder = 'Search for an asset (e.g., AAPL, Bitcoin)',
  label = 'Asset',
  required = false,
  customAssetEnabled = true,
  className
}: AssetSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const debouncedSearchRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear the debounce timer when component unmounts
  useEffect(() => {
    return () => {
      if (debouncedSearchRef.current) {
        clearTimeout(debouncedSearchRef.current);
      }
    };
  }, []);
  
  // Search for assets when query changes
  useEffect(() => {
    const performSearch = async (query: string) => {
      if (!query || query.length < 2) {
        // Don't search for very short queries
        setResults([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/assets/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error('Failed to search assets');
        }
        
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error searching assets:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce search to avoid too many API calls
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current);
    }
    
    debouncedSearchRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
  }, [searchQuery]);
  
  // Initialize with popular assets when first opened
  useEffect(() => {
    if (open && results.length === 0 && !isLoading && !searchQuery) {
      setIsLoading(true);
      fetch('/api/assets/search?q=')
        .then(res => res.json())
        .then(data => {
          setResults(data);
        })
        .catch(error => {
          console.error('Error fetching popular assets:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, results.length, isLoading, searchQuery]);
  
  // If we have an initial value, try to look it up
  useEffect(() => {
    if (initialValue && !selectedAsset) {
      fetch(`/api/assets/${encodeURIComponent(initialValue)}`)
        .then(res => {
          if (!res.ok) {
            // If we can't find it, just use the initial value as a symbol
            return { symbol: initialValue, name: initialValue };
          }
          return res.json();
        })
        .then(data => {
          if (data) {
            setSelectedAsset(data);
            setInputValue(data.symbol);
          }
        })
        .catch(error => {
          console.error('Error fetching asset details:', error);
        });
    }
  }, [initialValue, selectedAsset]);
  
  const handleSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setInputValue(asset.symbol);
    setOpen(false);
    onSelect(asset);
  };
  
  const handleAddCustom = () => {
    if (!searchQuery) return;
    
    const customAsset: Asset = {
      symbol: searchQuery.toUpperCase(),
      name: searchQuery.toUpperCase(),
      type: 'Other'
    };
    
    handleSelect(customAsset);
  };
  
  const handleClear = () => {
    setSelectedAsset(null);
    setInputValue('');
    setSearchQuery('');
    onSelect({ symbol: '', name: '' });
  };
  
  // Different UI states based on selection
  const renderTrigger = () => {
    if (selectedAsset) {
      // Show the selected asset with a clear button
      return (
        <div className="flex items-center justify-between w-full px-3 py-2 border rounded-md">
          <div className="flex items-center space-x-2">
            <div className="font-medium">{selectedAsset.symbol}</div>
            <div className="text-muted-foreground">{selectedAsset.name}</div>
            {selectedAsset.type && (
              <div className="px-2 py-0.5 text-xs bg-muted rounded-full">
                {selectedAsset.type}
              </div>
            )}
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    
    // Show the search input
    return (
      <div className="flex items-center space-x-2 w-full px-3 py-2 border rounded-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{placeholder}</span>
      </div>
    );
  };
  
  return (
    <div className={cn("grid w-full gap-1.5", className)}>
      {label && (
        <Label htmlFor="asset-search">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {renderTrigger()}
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]" align="start">
          <Command>
            <CommandInput 
              placeholder="Search for assets..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              
              {!isLoading && results.length === 0 && (
                <CommandEmpty className="py-3 px-4">
                  <div>
                    <p>No assets found.</p>
                    {customAssetEnabled && searchQuery && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddCustom}
                        className="mt-2"
                      >
                        Add "{searchQuery}" as custom asset
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
              )}
              
              {results.length > 0 && (
                <CommandGroup>
                  {results.map((asset) => (
                    <CommandItem
                      key={asset.symbol}
                      value={`${asset.symbol}-${asset.name}`}
                      onSelect={() => handleSelect(asset)}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span className="font-medium">{asset.symbol}</span>
                          {asset.type && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                              {asset.type}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground truncate">
                          {asset.name}
                          {asset.exchange && ` • ${asset.exchange}`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}