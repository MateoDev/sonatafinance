import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ChangeComparison from "./ChangeComparison";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { ProcessedFinancialData } from '@/lib/types';

interface DataConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processedData: ProcessedFinancialData | null;
  existingData: any[] | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export default function DataConfirmationDialog({
  open,
  onOpenChange,
  processedData,
  existingData,
  onConfirm,
  isSubmitting
}: DataConfirmationDialogProps) {
  if (!processedData) return null;

  // Map types to readable labels
  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'investment': 'Investment',
      'expense': 'Budget Item',
      'liability': 'Liability',
      'payment': 'Payment',
      'goal': 'Financial Goal'
    };
    return labels[type] || type;
  };

  // Function to find existing item for comparison
  const findExistingItem = (newItem: any): any | null => {
    if (!existingData) return null;
    
    // Try to match by name/id/identifier fields
    if (newItem.name && newItem.symbol) {
      // For investments, match on symbol
      return existingData.find(item => 
        item.symbol === newItem.symbol && 
        item.name === newItem.name
      );
    }
    
    if (newItem.name) {
      return existingData.find(item => item.name === newItem.name);
    }
    
    if (newItem.description) {
      return existingData.find(item => item.description === newItem.description);
    }
    
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Financial Data Changes</DialogTitle>
          <DialogDescription>
            Review the extracted financial data before saving to the database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Alert variant={processedData.confidence > 0.7 ? "default" : "destructive"}>
            {processedData.confidence > 0.7 ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {processedData.confidence > 0.7 
                ? "High Confidence Data" 
                : "Please Review Carefully"}
            </AlertTitle>
            <AlertDescription>
              {processedData.confidence > 0.7 
                ? `The system has extracted ${processedData.items.length} ${getTypeLabel(processedData.type)} items with high confidence (${Math.round(processedData.confidence * 100)}%).` 
                : `The system has lower confidence (${Math.round(processedData.confidence * 100)}%) in some of these items. Please review carefully before confirming.`}
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <h3 className="text-lg font-medium">{processedData.summary}</h3>
            
            {processedData.items.map((item, index) => {
              const existingItem = findExistingItem(item);
              const itemType = getTypeLabel(processedData.type);
              const title = item.name || item.description || `${itemType} ${index + 1}`;
              
              return (
                <ChangeComparison
                  key={index}
                  oldItem={existingItem}
                  newItem={item}
                  title={title}
                  itemType={itemType}
                />
              );
            })}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Confirm & Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}