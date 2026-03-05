import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Get all financial goals
export function useFinancialGoals() {
  return useQuery({
    queryKey: ["/api/goals"],
    staleTime: 1000 * 60, // 1 minute
  });
}

// Get a specific financial goal by ID
export function useFinancialGoal(goalId: number) {
  return useQuery({
    queryKey: ["/api/goals", goalId],
    enabled: !!goalId,
  });
}

// Create a new financial goal
export function useCreateFinancialGoal() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (goalData: any) => {
      const response = await apiRequest("POST", "/api/goals", goalData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the goals query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      
      toast({
        title: "Goal created",
        description: "Your financial goal has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create goal",
        description: error.message || "An error occurred while creating the goal.",
        variant: "destructive",
      });
    },
  });
}

// Update an existing financial goal
export function useUpdateFinancialGoal() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, goalData }: { id: number; goalData: any }) => {
      const response = await apiRequest("PATCH", `/api/goals/${id}`, goalData);
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific goal
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals", variables.id] });
      
      toast({
        title: "Goal updated",
        description: "Your financial goal has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update goal",
        description: error.message || "An error occurred while updating the goal.",
        variant: "destructive",
      });
    },
  });
}

// Update a goal's progress
export function useUpdateGoalProgress() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, currentAmount }: { id: number; currentAmount: string }) => {
      const response = await apiRequest("PATCH", `/api/goals/${id}/progress`, { currentAmount });
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific goal
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals", variables.id] });
      
      toast({
        title: "Progress updated",
        description: "Your goal progress has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update progress",
        description: error.message || "An error occurred while updating progress.",
        variant: "destructive",
      });
    },
  });
}

// Mark a goal as complete
export function useCompleteGoal() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/goals/${id}/complete`, {});
      return response.json();
    },
    onSuccess: (_, id) => {
      // Invalidate both the list and the specific goal
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals", id] });
      
      toast({
        title: "Goal completed",
        description: "Congratulations! You've achieved your financial goal.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete goal",
        description: error.message || "An error occurred while completing the goal.",
        variant: "destructive",
      });
    },
  });
}

// Delete a financial goal
export function useDeleteFinancialGoal() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/goals/${id}`);
      return id;
    },
    onSuccess: (id) => {
      // Invalidate both the list and the specific goal
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals", id] });
      
      toast({
        title: "Goal deleted",
        description: "Your financial goal has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete goal",
        description: error.message || "An error occurred while deleting the goal.",
        variant: "destructive",
      });
    },
  });
}