import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import EditInvestmentForm from '@/components/investments/EditInvestmentForm';
import type { Investment } from '@/lib/types';

export default function InvestmentsList() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const itemsPerPage = 5;

  const { data: investments, isLoading } = useQuery<Investment[]>({
    queryKey: ['/api/investments'],
    // Force refresh when component mounts or window focuses
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/investments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/allocation'] });
      toast({
        title: "Investment deleted",
        description: "The investment has been removed from your portfolio.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete investment",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });

  const filteredInvestments = investments ? 
    investments.filter(inv => 
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inv.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.type.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

  const totalPages = Math.ceil(filteredInvestments.length / itemsPerPage);
  const paginatedInvestments = filteredInvestments.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handleDeleteInvestment = (id: number) => {
    if (confirm("Are you sure you want to delete this investment?")) {
      deleteInvestmentMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-neutral-800">Your Investments</h3>
            <div className="animate-pulse w-64 h-10 bg-neutral-100 rounded-lg"></div>
          </div>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-neutral-100 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white rounded-xl shadow-sm mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <h3 className="font-semibold text-lg text-neutral-800">Your Investments</h3>
            <div className="flex items-center">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-neutral-400 text-sm">search</span>
                </span>
                <Input
                  type="text"
                  placeholder="Search investments..."
                  className="pl-10 pr-4 py-2 border-neutral-300 focus:ring-primary focus:border-primary sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary-dark hidden sm:flex">
                <span className="material-icons">filter_list</span>
              </Button>
            </div>
          </div>
          
          {paginatedInvestments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-neutral-500">
                {searchQuery 
                  ? "No investments match your search criteria" 
                  : "You don't have any investments yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full table-auto">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider text-left">
                    <th className="px-4 py-3 rounded-l-lg">Asset</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Holdings</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Performance</th>
                    <th className="px-4 py-3 rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {paginatedInvestments.map((investment) => (
                    <tr key={investment.id} className="hover:bg-neutral-50 flex flex-col md:table-row border-b md:border-b-0 pb-4 mb-4 md:pb-0 md:mb-0">
                      <td className="px-4 py-4 flex items-center">
                        <div 
                          className={`mr-3 bg-${investment.logoColor || 'blue'}-100 text-${investment.logoColor || 'blue'}-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold`}
                        >
                          {investment.logoInitial || investment.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-neutral-800">{investment.name}</div>
                          <div className="text-xs text-neutral-500">{investment.symbol}</div>
                        </div>
                      </td>
                      
                      {/* Mobile card view - only visible on small screens */}
                      <td className="md:hidden px-4 py-2 grid grid-cols-2 gap-2">
                        <div className="text-xs text-neutral-500">Type</div>
                        <div className="text-sm font-medium">{investment.type}</div>
                        
                        <div className="text-xs text-neutral-500">Price</div>
                        <div className="text-sm font-medium">
                          ${investment.price ? investment.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                        </div>
                        
                        <div className="text-xs text-neutral-500">Holdings</div>
                        <div className="text-sm font-medium">
                          {investment.type === 'Crypto' 
                            ? `${investment.quantity} ${investment.symbol}`
                            : `${investment.quantity} ${investment.type === 'Stock' || investment.type === 'ETF' ? 'shares' : 'units'}`
                          }
                        </div>
                        
                        <div className="text-xs text-neutral-500">Value</div>
                        <div className="text-sm font-medium">
                          ${investment.value ? investment.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                        </div>
                        
                        <div className="text-xs text-neutral-500">Performance</div>
                        <div className="flex items-center">
                          <div className={`${(investment.performancePercent ?? 0) >= 0 ? 'text-success' : 'text-danger'} font-medium text-sm`}>
                            {(investment.performancePercent ?? 0) >= 0 ? '+' : ''}{(investment.performancePercent ?? 0).toFixed(2)}%
                          </div>
                        </div>
                        
                        <div className="text-xs text-neutral-500">Actions</div>
                        <div className="flex">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-neutral-400 hover:text-primary mr-2 transition-colors"
                            onClick={() => setEditingInvestment(investment)}
                          >
                            <span className="material-icons text-sm">edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-neutral-400 hover:text-danger transition-colors"
                            onClick={() => handleDeleteInvestment(investment.id)}
                            disabled={deleteInvestmentMutation.isPending}
                          >
                            <span className="material-icons text-sm">delete</span>
                          </Button>
                        </div>
                      </td>
                      
                      {/* Desktop view - hidden on mobile */}
                      <td className="px-4 py-4 text-sm text-neutral-600 hidden md:table-cell">{investment.type}</td>
                      <td className="px-4 py-4 text-sm font-medium text-neutral-800 hidden md:table-cell">
                        ${investment.price ? investment.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600 hidden md:table-cell">
                        {investment.type === 'Crypto' 
                          ? `${investment.quantity} ${investment.symbol}`
                          : `${investment.quantity} ${investment.type === 'Stock' || investment.type === 'ETF' ? 'shares' : 'units'}`
                        }
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-neutral-800 hidden md:table-cell">
                        ${investment.value ? investment.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center">
                          <div className={`${(investment.performancePercent ?? 0) >= 0 ? 'text-success' : 'text-danger'} font-medium text-sm`}>
                            {(investment.performancePercent ?? 0) >= 0 ? '+' : ''}{(investment.performancePercent ?? 0).toFixed(2)}%
                          </div>
                          <div className="w-16 h-6 ml-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={(investment.performanceHistory || []).map((val, i) => ({ value: val }))}>
                                <Line 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke={(investment.performancePercent ?? 0) >= 0 ? '#10B981' : '#EF4444'} 
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-neutral-400 hover:text-primary mr-2 transition-colors"
                          onClick={() => setEditingInvestment(investment)}
                        >
                          <span className="material-icons text-sm">edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-neutral-400 hover:text-danger transition-colors"
                          onClick={() => handleDeleteInvestment(investment.id)}
                          disabled={deleteInvestmentMutation.isPending}
                        >
                          <span className="material-icons text-sm">delete</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-neutral-500">
                Showing {paginatedInvestments.length} of {filteredInvestments.length} investments
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-600"
                >
                  <span className="material-icons text-sm">chevron_left</span>
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                      currentPage === i + 1 ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-600"
                >
                  <span className="material-icons text-sm">chevron_right</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editingInvestment !== null} onOpenChange={(open) => !open && setEditingInvestment(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Investment</DialogTitle>
          </DialogHeader>
          {editingInvestment && (
            <EditInvestmentForm 
              investment={editingInvestment} 
              onCancel={() => setEditingInvestment(null)}
              onSuccess={() => {
                setEditingInvestment(null);
                queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
                queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
                queryClient.invalidateQueries({ queryKey: ['/api/portfolio/allocation'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}