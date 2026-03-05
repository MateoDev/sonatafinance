import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Path to the Excel file
const excelFilePath = path.resolve('./attached_assets/Personal Finance [Updated: Mar 2025].xlsx');

// Function to extract data from the Excel file
function processExcelFile(filePath: string) {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get all sheet names
    const sheetNames = workbook.SheetNames;
    
    // Process each sheet
    const results: Record<string, any[]> = {};
    
    sheetNames.forEach(sheetName => {
      // Get the worksheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      results[sheetName] = data;
    });
    
    console.log('Successfully processed Excel file.');
    console.log(`Found ${sheetNames.length} sheets: ${sheetNames.join(', ')}`);
    
    // Output the results
    for (const [sheetName, data] of Object.entries(results)) {
      console.log(`\n--- ${sheetName} (${data.length} rows) ---`);
      if (data.length > 0) {
        console.log('Sample data:', data[0]);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return null;
  }
}

// Process the Excel file
const data = processExcelFile(excelFilePath);

// Output the complete data structure as JSON
if (data) {
  const outputPath = path.resolve('./processed-finance-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\nFinancial data saved to ${outputPath}`);
}