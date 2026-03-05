import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProcessedFinancialData } from "@/lib/types";

export function useDataProcessing() {
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedFinancialData | null>(null);
  const [existingData, setExistingData] = useState<any[] | null>(null);

  // Process natural language input
  const processNaturalLanguageMutation = useMutation({
    mutationFn: async (input: string) => {
      const res = await apiRequest("POST", "/api/chat/process-natural-language", { input });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to process input");
      }
      return json.data as ProcessedFinancialData;
    },
    onSuccess: async (data) => {
      setProcessedData(data);
      
      // Fetch existing data of the same type for comparison
      try {
        let endpoint = "";
        switch (data.type) {
          case "investment":
            endpoint = "/api/investments";
            break;
          case "expense":
            endpoint = "/api/budget";
            break;
          case "liability":
            endpoint = "/api/liabilities";
            break;
          case "payment":
            endpoint = "/api/payments";
            break;
          case "goal":
            endpoint = "/api/goals";
            break;
        }
        
        if (endpoint) {
          const res = await apiRequest("GET", endpoint);
          const existingItems = await res.json();
          setExistingData(existingItems);
        }
        
        setShowConfirmDialog(true);
      } catch (err) {
        console.error("Failed to fetch existing data for comparison", err);
        // Still show dialog even if we couldn't get existing data
        setShowConfirmDialog(true);
      }
    },
    onError: (error) => {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Process spreadsheet data
  const processSpreadsheetMutation = useMutation({
    mutationFn: async (spreadsheetData: any) => {
      const res = await apiRequest("POST", "/api/chat/process-spreadsheet", { spreadsheetData });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to process spreadsheet");
      }
      return json.data as ProcessedFinancialData[];
    },
    onSuccess: (data) => {
      // For simplicity, we'll just handle the first category of data found
      // In a real app, you might want to let users select which category to save
      if (data && data.length > 0) {
        setProcessedData(data[0]);
        setShowConfirmDialog(true);
      } else {
        toast({
          title: "No data found",
          description: "No financial data could be extracted from the spreadsheet",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Save processed data
  const saveDataMutation = useMutation({
    mutationFn: async (data: ProcessedFinancialData) => {
      const res = await apiRequest("POST", "/api/chat/save-processed-data", {
        type: data.type,
        items: data.items,
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to save data");
      }
      return json;
    },
    onSuccess: (_, variables) => {
      // Close the dialog
      setShowConfirmDialog(false);
      setProcessedData(null);
      setExistingData(null);
      
      // Invalidate relevant queries based on data type
      switch (variables.type) {
        case "investment":
          queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
          queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
          queryClient.invalidateQueries({ queryKey: ["/api/portfolio/allocation"] });
          break;
        case "expense":
          queryClient.invalidateQueries({ queryKey: ["/api/budget"] });
          break;
        case "liability":
          queryClient.invalidateQueries({ queryKey: ["/api/liabilities"] });
          break;
        case "payment":
          queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
          break;
        case "goal":
          queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
          break;
      }
      
      toast({
        title: "Data saved successfully",
        description: `The ${variables.type} data has been saved to your account.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save data",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleProcessNaturalLanguage = (input: string) => {
    processNaturalLanguageMutation.mutate(input);
  };

  const handleProcessSpreadsheet = (data: any) => {
    processSpreadsheetMutation.mutate(data);
  };

  const handleSaveData = () => {
    if (processedData) {
      saveDataMutation.mutate(processedData);
    }
  };

  const handleCancelDialog = () => {
    setShowConfirmDialog(false);
    setProcessedData(null);
    setExistingData(null);
  };

  return {
    processNaturalLanguage: handleProcessNaturalLanguage,
    processSpreadsheet: handleProcessSpreadsheet,
    saveData: handleSaveData,
    cancelDialog: handleCancelDialog,
    isProcessingNaturalLanguage: processNaturalLanguageMutation.isPending,
    isProcessingSpreadsheet: processSpreadsheetMutation.isPending,
    isSavingData: saveDataMutation.isPending,
    showConfirmDialog,
    setShowConfirmDialog,
    processedData,
    existingData,
  };
}