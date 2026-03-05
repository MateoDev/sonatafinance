import { useState } from "react";
import { Edit, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Confetti } from "./ui/confetti";
import { formatCurrency } from "@/lib/utils";
import { useDeleteFinancialGoal, useUpdateGoalProgress, useCompleteGoal } from "@/hooks/use-financial-goals";

interface FinancialGoalCardProps {
  goal: {
    id: number;
    name: string;
    description: string | null;
    type: string;
    targetAmount: string;
    currentAmount: string;
    targetDate: string | null;
    color: string | null;
    isCompleted: boolean;
  };
  showEditDialog?: (goal: any) => void;
}

export default function FinancialGoalCard({ goal, showEditDialog }: FinancialGoalCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [progressValue, setProgressValue] = useState(() => {
    const target = parseFloat(goal.targetAmount);
    const current = parseFloat(goal.currentAmount);
    return target > 0 ? Math.min(100, (current / target) * 100) : 0;
  });
  
  const deleteGoalMutation = useDeleteFinancialGoal();
  const updateProgressMutation = useUpdateGoalProgress();
  const completeGoalMutation = useCompleteGoal();
  
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date set";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleQuickIncrement = (increment: number) => {
    const current = parseFloat(goal.currentAmount);
    const target = parseFloat(goal.targetAmount);
    
    // Calculate the increment amount (percentage of target)
    const incrementAmount = target * (increment / 100);
    const newAmount = current + incrementAmount;
    
    // Don't exceed target amount
    const finalAmount = Math.min(newAmount, target);
    
    updateProgressMutation.mutate(
      { id: goal.id, currentAmount: finalAmount.toString() },
      {
        onSuccess: (updatedGoal) => {
          const newProgressValue = Math.min(100, (finalAmount / target) * 100);
          setProgressValue(newProgressValue);
          
          // If we just hit 100%, show confetti!
          if (newProgressValue >= 100 && progressValue < 100) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);
          }
        }
      }
    );
  };
  
  const handleCompleteGoal = () => {
    completeGoalMutation.mutate(goal.id, {
      onSuccess: () => {
        // Show confetti when goal is completed
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    });
  };
  
  return (
    <>
      {showConfetti && <Confetti />}
      
      <Card className="overflow-hidden border-t-4" style={{ borderTopColor: goal.color || '#3b82f6' }}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold">{goal.name}</CardTitle>
            <div className="flex space-x-1">
              {!goal.isCompleted && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => showEditDialog?.(goal)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Financial Goal</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{goal.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => deleteGoalMutation.mutate(goal.id)}
                      disabled={deleteGoalMutation.isPending}
                    >
                      {deleteGoalMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          {goal.description && (
            <p className="text-sm text-neutral-600 mb-3">
              {goal.description}
            </p>
          )}
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-neutral-500">Progress</span>
              <span className="font-medium">{progressValue.toFixed(0)}%</span>
            </div>
            
            <Progress 
              value={progressValue} 
              className="h-2" 
              indicatorColor={goal.color}
            />
            
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Current</span>
              <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Target</span>
              <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
            </div>
            
            {goal.targetDate && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Target Date</span>
                <span className="font-medium">{formatDate(goal.targetDate)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Category</span>
              <span className="font-medium">{goal.type}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex-col space-y-2 pt-2">
          {!goal.isCompleted ? (
            <>
              <div className="grid grid-cols-4 gap-1 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickIncrement(5)}
                  disabled={progressValue >= 100 || updateProgressMutation.isPending}
                >
                  +5%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickIncrement(10)}
                  disabled={progressValue >= 100 || updateProgressMutation.isPending}
                >
                  +10%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickIncrement(25)}
                  disabled={progressValue >= 100 || updateProgressMutation.isPending}
                >
                  +25%
                </Button>
                <Button
                  size="sm"
                  className="text-xs"
                  disabled={updateProgressMutation.isPending}
                  onClick={() => handleCompleteGoal()}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Done
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center w-full">
              <Check className="h-4 w-4 mr-2" />
              Goal completed!
            </div>
          )}
        </CardFooter>
      </Card>
    </>
  );
}