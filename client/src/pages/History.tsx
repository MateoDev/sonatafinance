import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Activity } from '@/lib/types';

export default function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });
  
  const filteredActivities = activities ? 
    activities.filter(activity => {
      const matchesSearch = 
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.investmentName && activity.investmentName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || activity.type === typeFilter;
      
      return matchesSearch && matchesType;
    }) : [];
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return { icon: 'add_circle', bgColor: 'bg-green-100', textColor: 'text-green-600' };
      case 'SELL':
        return { icon: 'remove_circle', bgColor: 'bg-red-100', textColor: 'text-red-600' };
      case 'DIVIDEND':
        return { icon: 'sync', bgColor: 'bg-blue-100', textColor: 'text-blue-600' };
      case 'DEPOSIT':
        return { icon: 'attach_money', bgColor: 'bg-purple-100', textColor: 'text-purple-600' };
      case 'WITHDRAWAL':
        return { icon: 'money_off', bgColor: 'bg-amber-100', textColor: 'text-amber-600' };
      default:
        return { icon: 'info', bgColor: 'bg-neutral-100', textColor: 'text-neutral-600' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Transaction History" />
        <div className="px-4 sm:px-6 lg:px-8">
          <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-neutral-100 rounded-lg w-64"></div>
                <div className="h-80 bg-neutral-100 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Transaction History" />
      
      <div className="px-4 sm:px-6 lg:px-8">
        <Card className="bg-white rounded-xl shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="font-semibold text-lg text-neutral-800">Activity History</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="material-icons text-neutral-400 text-sm">search</span>
                  </span>
                  <Input
                    type="text"
                    placeholder="Search activities..."
                    className="pl-10 pr-4 py-2 border-neutral-300 rounded-lg w-full md:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                    <SelectItem value="DIVIDEND">Dividend</SelectItem>
                    <SelectItem value="DEPOSIT">Deposit</SelectItem>
                    <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredActivities.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-neutral-500">
                  {searchQuery || typeFilter !== 'all'
                    ? "No activities match your filter criteria" 
                    : "No transaction history available"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50">
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => {
                      const { icon, bgColor, textColor } = getActivityIcon(activity.type);
                      return (
                        <TableRow key={activity.id} className="hover:bg-neutral-50">
                          <TableCell>
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${textColor} mr-2`}>
                                <span className="material-icons text-sm">{icon}</span>
                              </div>
                              <span>{activity.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(activity.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>{activity.description}</TableCell>
                          <TableCell className="text-right">
                            <span className={
                              activity.type === 'DIVIDEND' || activity.type === 'DEPOSIT' 
                                ? 'text-success' 
                                : ''
                            }>
                              {activity.type === 'DIVIDEND' || activity.type === 'DEPOSIT' ? '+' : ''}
                              ${activity.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {activity.quantity 
                              ? activity.quantity.toLocaleString(undefined, {
                                  minimumFractionDigits: activity.type === 'CRYPTO' ? 6 : 0,
                                  maximumFractionDigits: activity.type === 'CRYPTO' ? 6 : 0
                                })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {activity.price 
                              ? `$${activity.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
