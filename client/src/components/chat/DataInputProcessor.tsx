import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileUp, 
  MessageSquareText, 
  Send, 
  Upload, 
  RotateCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDataProcessing } from '@/hooks/use-data-processing';
import DataConfirmationDialog from './DataConfirmationDialog';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';

export default function DataInputProcessor() {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<any | null>(null);
  const { toast } = useToast();
  
  const {
    processNaturalLanguage,
    processSpreadsheet,
    saveData,
    cancelDialog,
    isProcessingNaturalLanguage,
    isProcessingSpreadsheet,
    isSavingData,
    showConfirmDialog,
    setShowConfirmDialog,
    processedData,
    existingData,
  } = useDataProcessing();

  const handleNaturalLanguageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalLanguageInput.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some financial information to process",
        variant: "destructive",
      });
      return;
    }
    
    processNaturalLanguage(naturalLanguageInput);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Check if file is an Excel file
    const isExcel = 
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');
    
    if (!isExcel) {
      toast({
        title: "Invalid file format",
        description: "Please upload an Excel spreadsheet (.xlsx or .xls)",
        variant: "destructive",
      });
      setSelectedFile(null);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume the first sheet has the data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setFileContent({
          filename: file.name,
          sheet: firstSheetName,
          data: jsonData
        });
      } catch (error) {
        toast({
          title: "Error reading spreadsheet",
          description: "The selected file could not be processed",
          variant: "destructive",
        });
        setSelectedFile(null);
        setFileContent(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSpreadsheetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContent) {
      toast({
        title: "No file selected",
        description: "Please select a spreadsheet to process",
        variant: "destructive",
      });
      return;
    }
    
    processSpreadsheet(fileContent);
  };

  const handleConfirmSave = () => {
    saveData();
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Add Financial Data</CardTitle>
          <CardDescription>
            Enter financial data in natural language or upload a spreadsheet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">
                <MessageSquareText className="mr-2 h-4 w-4" />
                Natural Language
              </TabsTrigger>
              <TabsTrigger value="spreadsheet">
                <FileUp className="mr-2 h-4 w-4" />
                Spreadsheet
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <form onSubmit={handleNaturalLanguageSubmit}>
                <div className="flex flex-col space-y-4">
                  <Textarea
                    placeholder="Enter financial data in natural language. For example: 'I bought 10 shares of Apple stock at $150 per share yesterday' or 'Add a monthly expense of $50 for my gym membership'"
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <Button 
                    type="submit" 
                    className="self-end"
                    disabled={isProcessingNaturalLanguage || !naturalLanguageInput.trim()}
                  >
                    {isProcessingNaturalLanguage ? (
                      <>
                        <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Process Text
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="spreadsheet">
              <form onSubmit={handleSpreadsheetSubmit}>
                <div className="flex flex-col space-y-4">
                  <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="spreadsheet" className="text-sm font-medium">
                        Upload Spreadsheet
                      </label>
                      <div className="flex items-center">
                        <Input
                          id="spreadsheet"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    {selectedFile && (
                      <div className="flex items-center p-3 border rounded bg-slate-50">
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="self-end" 
                    disabled={isProcessingSpreadsheet || !selectedFile}
                  >
                    {isProcessingSpreadsheet ? (
                      <>
                        <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Process Spreadsheet
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div>
            All data is processed locally and securely
          </div>
        </CardFooter>
      </Card>
      
      <DataConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        processedData={processedData}
        existingData={existingData}
        onConfirm={handleConfirmSave}
        isSubmitting={isSavingData}
      />
    </>
  );
}