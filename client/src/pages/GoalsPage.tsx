import { useState } from "react";
import { Plus } from "lucide-react";
import { useFinancialGoals } from "@/hooks/use-financial-goals";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import FinancialGoalCard from "@/components/FinancialGoalCard";
import FinancialGoalForm from "@/components/FinancialGoalForm";

export default function GoalsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  
  const { data: goals, isLoading } = useFinancialGoals();
  
  const handleShowAddDialog = () => {
    setShowAddDialog(true);
  };
  
  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingGoal(null);
  };
  
  const handleShowEditDialog = (goal: any) => {
    setEditingGoal(goal);
  };
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Financial Goals</h2>
        <Button 
          onClick={handleShowAddDialog}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <div className="pt-2">
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {goals.map((goal) => (
            <FinancialGoalCard 
              key={goal.id} 
              goal={goal} 
              showEditDialog={handleShowEditDialog}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg bg-neutral-50">
          <h3 className="text-lg font-medium text-neutral-700 mb-2">No goals yet</h3>
          <p className="text-neutral-500 mb-4">
            Create your first financial goal to start tracking your progress.
          </p>
          <Button onClick={handleShowAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </div>
      )}
      
      {/* Dialog for adding/editing goals */}
      <Dialog open={showAddDialog || !!editingGoal} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-1">
              <FinancialGoalForm 
                onSuccess={handleCloseDialog} 
                existingGoal={editingGoal}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}