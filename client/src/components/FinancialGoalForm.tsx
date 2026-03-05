import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { goalTypes } from "@shared/schema";
import { useCreateFinancialGoal, useUpdateFinancialGoal } from "@/hooks/use-financial-goals";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FinancialGoalFormProps {
  onSuccess?: () => void;
  existingGoal?: {
    id: number;
    name: string;
    description: string | null;
    type: string;
    targetAmount: string;
    currentAmount: string;
    targetDate: string | null;
    color: string | null;
  };
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().nullable().optional(),
  type: z.enum(goalTypes as [string, ...string[]]),
  targetAmount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Target amount must be a positive number"
  ),
  currentAmount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    "Current amount must be a non-negative number"
  ),
  targetDate: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function FinancialGoalForm({ onSuccess, existingGoal }: FinancialGoalFormProps) {
  const [color, setColor] = useState<string>(existingGoal?.color || "#3b82f6");
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const isEditing = !!existingGoal;
  
  const createGoalMutation = useCreateFinancialGoal();
  const updateGoalMutation = useUpdateFinancialGoal();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingGoal?.name || "",
      description: existingGoal?.description || "",
      type: existingGoal?.type || "Savings",
      targetAmount: existingGoal?.targetAmount || "",
      currentAmount: existingGoal?.currentAmount || "0",
      targetDate: existingGoal?.targetDate || null,
      color: existingGoal?.color || "#3b82f6",
    },
  });
  
  function onSubmit(values: FormValues) {
    // Add the color to the form values if not included
    values.color = color;
    
    if (isEditing && existingGoal) {
      updateGoalMutation.mutate(
        { id: existingGoal.id, goalData: values },
        {
          onSuccess: () => {
            form.reset();
            onSuccess?.();
          },
        }
      );
    } else {
      createGoalMutation.mutate(values, {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      });
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input placeholder="Emergency Fund" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Save for unexpected expenses..."
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a goal type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {goalTypes.map((type) => (
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Amount</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Amount</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="targetDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                When do you want to achieve this goal?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Color</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-[160px] justify-start text-left font-normal flex items-center"
                        style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
                      >
                        <div
                          className="h-4 w-4 rounded-full mr-2 border"
                          style={{ backgroundColor: color }}
                        />
                        <span>{color}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <HexColorPicker
                        color={color}
                        onChange={(newColor) => {
                          setColor(newColor);
                          field.onChange(newColor);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
        >
          {createGoalMutation.isPending || updateGoalMutation.isPending
            ? "Saving..."
            : isEditing
              ? "Update Goal"
              : "Create Goal"}
        </Button>
      </form>
    </Form>
  );
}