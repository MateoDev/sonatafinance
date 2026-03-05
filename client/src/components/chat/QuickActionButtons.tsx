import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight, PlusCircle, Calculator, TrendingUp, CreditCard, HelpCircle, DollarSign } from "lucide-react";

type QuickActionProps = {
  onActionClick: (prompt: string) => void;
};

type ActionButton = {
  label: string;
  prompt: string;
  icon: React.ReactNode;
  category: 'data' | 'analysis' | 'help';
  color?: string;
};

export default function QuickActionButtons({ onActionClick }: QuickActionProps) {
  const actionButtons: ActionButton[] = [
    // Data entry actions
    {
      label: "Add expense",
      prompt: "Add an expense of $20 for lunch today",
      icon: <PlusCircle className="h-4 w-4" />,
      category: 'data',
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
    },
    {
      label: "Record investment",
      prompt: "I bought 5 shares of AAPL at $175 per share yesterday",
      icon: <TrendingUp className="h-4 w-4" />,
      category: 'data',
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
    },
    {
      label: "Add bill payment",
      prompt: "Add a monthly bill payment of $89.99 for internet subscription",
      icon: <CreditCard className="h-4 w-4" />,
      category: 'data',
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
    },
    
    // Analysis actions
    {
      label: "Monthly budget",
      prompt: "How much have I spent this month and how does it compare to my budget?",
      icon: <Calculator className="h-4 w-4" />,
      category: 'analysis',
      color: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
    },
    {
      label: "Upcoming bills",
      prompt: "What bills are due in the next two weeks and what's the total amount?",
      icon: <DollarSign className="h-4 w-4" />,
      category: 'analysis',
      color: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
    },
    {
      label: "Spending insights",
      prompt: "Where am I spending too much money compared to my budget?",
      icon: <HelpCircle className="h-4 w-4" />,
      category: 'analysis',
      color: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Add Data</h3>
        <div className="flex flex-wrap gap-2">
          {actionButtons
            .filter(button => button.category === 'data')
            .map((button, index) => (
              <Button
                key={index}
                variant="outline"
                className={`text-xs h-8 px-2 ${button.color}`}
                onClick={() => onActionClick(button.prompt)}
              >
                {button.icon}
                <span className="ml-1">{button.label}</span>
              </Button>
            ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Get Insights</h3>
        <div className="flex flex-wrap gap-2">
          {actionButtons
            .filter(button => button.category === 'analysis')
            .map((button, index) => (
              <Button
                key={index}
                variant="outline"
                className={`text-xs h-8 px-2 ${button.color}`}
                onClick={() => onActionClick(button.prompt)}
              >
                {button.icon}
                <span className="ml-1">{button.label}</span>
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
}