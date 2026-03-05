import { readFile } from 'fs/promises';
import xlsx from 'xlsx';

async function analyzeExcelFile() {
  try {
    // Read the Excel file
    const filePath = './attached_assets/Personal Finance [Updated: Mar 2025].xlsx';
    const buffer = await readFile(filePath);
    
    // Parse the Excel file
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    // Get all sheet names
    const sheetNames = workbook.SheetNames;
    console.log('Excel sheets:', sheetNames);
    
    // Look for budget-related sheets
    const budgetSheets = sheetNames.filter(name => 
      name.toLowerCase().includes('budget') || 
      name.toLowerCase().includes('expense') ||
      name.toLowerCase().includes('spending')
    );
    
    console.log('Budget-related sheets:', budgetSheets);
    
    // Analyze the budget sheets
    for (const sheetName of budgetSheets) {
      console.log(`\nAnalyzing sheet: ${sheetName}`);
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      // Print the first few rows to understand structure
      console.log('First 5 rows:');
      for (let i = 0; i < Math.min(5, data.length); i++) {
        console.log(`Row ${i + 1}:`, data[i]);
      }
      
      // Try to identify column headers
      const headerRow = data.find(row => row && row.length > 3);
      if (headerRow) {
        console.log('\nPossible column headers:', headerRow);
      }
      
      // Check for column types and data organization
      console.log('\nColumn analysis:');
      if (headerRow) {
        headerRow.forEach((header, index) => {
          if (header) {
            const columnValues = data.slice(1).map(row => row[index]).filter(val => val !== undefined);
            const sampleValues = columnValues.slice(0, 3);
            console.log(`Column "${header}": Sample values:`, sampleValues);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Error analyzing Excel file:', error);
  }
}

// Run the analysis
analyzeExcelFile();