import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Activity } from '@/lib/types';

export default function RecentActivities() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities/recent'],
  });

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
      <Card className="bg-white rounded-xl shadow-sm mb-8">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-neutral-800">Recent Activities</h3>
            <Button variant="link" size="sm" className="text-primary text-sm font-medium hover:text-primary-dark">
              View All
            </Button>
          </div>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-neutral-100 rounded w-1/4"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-neutral-100 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-neutral-100 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-sm mb-8">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-neutral-800">Recent Activities</h3>
          </div>
          <div className="text-center py-8">
            <p className="text-neutral-500">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm mb-8">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg text-neutral-800">Recent Activities</h3>
          <Button variant="link" size="sm" className="text-primary text-sm font-medium hover:text-primary-dark">
            View All
          </Button>
        </div>
        
        <div className="space-y-4">
          {activities.map((activity) => {
            const { icon, bgColor, textColor } = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-center">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${bgColor} flex items-center justify-center ${textColor}`}>
                  <span className="material-icons">{icon}</span>
                </div>
                <div className="ml-4 flex-1">
                  <div className="font-medium text-neutral-800">{activity.description}</div>
                  <div className="text-xs text-neutral-500">
                    {new Date(activity.date).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    activity.type === 'DIVIDEND' || activity.type === 'DEPOSIT' 
                      ? 'text-success' 
                      : (activity.type === 'WITHDRAWAL' || activity.type === 'SELL') 
                        ? 'text-neutral-800' 
                        : 'text-neutral-800'
                  }`}>
                    {activity.type === 'DIVIDEND' || activity.type === 'DEPOSIT' 
                      ? `+$${activity.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : `$${activity.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }
                  </div>
                  <div className="text-xs text-neutral-500">
                    {activity.type === 'BUY' || activity.type === 'SELL' 
                      ? 'Transaction' 
                      : activity.type === 'DIVIDEND' 
                        ? 'Dividend' 
                        : activity.type === 'DEPOSIT' 
                          ? 'Deposit' 
                          : 'Withdrawal'
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
