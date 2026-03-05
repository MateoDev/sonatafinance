import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { 
  insertInvestmentSchema, 
  assetTypes, 
  assetCategories,
  InsertInvestment
} from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft } from "lucide-react";
// Import our new AssetSearch component
import { AssetSearch, Asset } from '@/components/forms/AssetSearch';

export default function NewInvestment() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const form = useForm<InsertInvestment>({
    resolver: zodResolver(insertInvestmentSchema),
    defaultValues: {
      symbol: '',
      name: '',
      type: undefined,
      category: undefined,
      price: 0,
      quantity: 0,
      costBasis: 0,
      logoColor: 'blue',
      logoInitial: '',
      notes: '',
    },
  });

  // When an asset is selected, update the form values automatically
  useEffect(() => {
    if (selectedAsset) {
      // Update symbol and name fields
      form.setValue('symbol', selectedAsset.symbol);
      form.setValue('name', selectedAsset.name);
      
      // If the asset has a price, update it
      if (selectedAsset.price && selectedAsset.price > 0) {
        form.setValue('price', selectedAsset.price);
      }
      
      // If asset has a type that matches our schema, update it
      if (selectedAsset.type && assetTypes.includes(selectedAsset.type as any)) {
        form.setValue('type', selectedAsset.type as any);
      }
      
      // Set the logo initial to the first letter of the symbol
      if (selectedAsset.symbol && selectedAsset.symbol.length > 0) {
        form.setValue('logoInitial', selectedAsset.symbol.charAt(0).toUpperCase());
      }
      
      // Update cost basis if quantity is already set
      const quantity = form.getValues('quantity');
      if (quantity && selectedAsset.price) {
        form.setValue('costBasis', selectedAsset.price * quantity);
      }
    }
  }, [selectedAsset, form]);

  const createInvestmentMutation = useMutation({
    mutationFn: async (data: InsertInvestment) => {
      const response = await apiRequest('POST', '/api/investments', data);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      // First invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/allocation'] });
      
      // Use history.push instead of window.location for SPA navigation
      window.history.pushState({}, '', '/investments');
      
      // Force a re-render to refresh the investments list
      window.dispatchEvent(new PopStateEvent('popstate'));
      
      toast({
        title: 'Investment Added',
        description: 'Your investment has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create investment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InsertInvestment) => {
    // Make sure costBasis is set correctly if not provided
    if (!data.costBasis) {
      data.costBasis = data.price * data.quantity;
    }
    
    createInvestmentMutation.mutate(data);
  };

  // Handle asset selection from AssetSearch component
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            window.history.pushState({}, '', '/investments');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Add New Investment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment Details</CardTitle>
          <CardDescription>
            Enter the details of your new investment below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Asset Search Component - this is the main improvement */}
              <div className="mb-6">
                <AssetSearch 
                  onSelect={handleAssetSelect}
                  placeholder="Search for stocks, ETFs, cryptocurrencies..."
                  label="Find Asset"
                  customAssetEnabled={true}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Search by name or symbol. Popular assets are suggested. You can also add a custom asset.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Apple Inc." {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be auto-filled when you select an asset
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol/Ticker</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. AAPL" {...field} />
                      </FormControl>
                      <FormDescription>
                        The ticker symbol of the asset
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assetTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assetCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Use categories to group similar assets
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-7"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value));
                              // Update cost basis if quantity exists
                              const quantity = form.getValues('quantity');
                              if (quantity) {
                                form.setValue('costBasis', parseFloat(e.target.value) * quantity);
                              }
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Auto-filled for many assets
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value));
                            // Update cost basis if price exists
                            const price = form.getValues('price');
                            if (price) {
                              form.setValue('costBasis', price * parseFloat(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        How many units you own
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costBasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Basis (Total)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-7"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value));
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Total amount paid (auto-calculated)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoInitial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Initial</FormLabel>
                      <FormControl>
                        <Input
                          maxLength={1}
                          placeholder="A"
                          {...field}
                          onChange={(e) => {
                            // Just take the first character
                            if (e.target.value) {
                              field.onChange(e.target.value.charAt(0).toUpperCase());
                            } else {
                              field.onChange('');
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Single letter to display in asset icon
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Color</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <div className="flex items-center">
                              <div 
                                className={`h-4 w-4 rounded-full bg-${field.value}-500 mr-2`}
                              ></div>
                              <SelectValue placeholder="Select color" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'gray'].map((color) => (
                            <SelectItem key={color} value={color}>
                              <div className="flex items-center">
                                <div 
                                  className={`h-4 w-4 rounded-full bg-${color}-500 mr-2`}
                                ></div>
                                {color.charAt(0).toUpperCase() + color.slice(1)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details about this investment..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    window.history.pushState({}, '', '/investments');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInvestmentMutation.isPending}
                >
                  {createInvestmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Investment'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}