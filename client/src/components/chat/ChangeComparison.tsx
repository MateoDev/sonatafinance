import React from 'react';

export interface ChangeComparisonProps {
  items: any[];
  type: 'investment' | 'expense' | 'liability' | 'payment' | 'goal';
}

const ChangeComparison: React.FC<ChangeComparisonProps> = ({ items, type }) => {
  // Create headers based on the type of data
  const getHeaders = () => {
    switch(type) {
      case 'investment':
        return ['Name', 'Symbol', 'Type', 'Price', 'Quantity', 'Cost Basis'];
      case 'expense':
        return ['Category', 'Amount', 'Date', 'Description'];
      case 'liability':
        return ['Name', 'Amount', 'Interest Rate', 'Minimum Payment', 'Due Date'];
      case 'payment':
        return ['Name', 'Amount', 'Due Date', 'Frequency'];
      case 'goal':
        return ['Name', 'Target Amount', 'Current Amount', 'Target Date', 'Priority'];
      default:
        return ['Field', 'Value'];
    }
  };

  // Get the value from an item for display
  const getValue = (item: any, field: string) => {
    const fieldMap: Record<string, string> = {
      'Name': 'name',
      'Symbol': 'symbol',
      'Type': 'type',
      'Price': 'price',
      'Quantity': 'quantity',
      'Cost Basis': 'costBasis',
      'Category': 'category',
      'Amount': 'amount',
      'Date': 'date',
      'Description': 'description',
      'Interest Rate': 'interestRate',
      'Minimum Payment': 'minimumPayment',
      'Due Date': 'dueDate',
      'Frequency': 'frequency',
      'Target Amount': 'targetAmount',
      'Current Amount': 'currentAmount',
      'Target Date': 'targetDate',
      'Priority': 'priority',
    };
    
    const key = fieldMap[field] || field.toLowerCase();
    const value = item[key];
    
    if (value === undefined || value === null) {
      return '-';
    }
    
    // Format dates
    if (field.includes('Date') && value) {
      try {
        return new Date(value).toLocaleDateString();
      } catch (e) {
        return value;
      }
    }
    
    // Format currency
    if (field === 'Price' || field === 'Cost Basis' || field === 'Amount' || 
        field === 'Target Amount' || field === 'Current Amount' || field === 'Minimum Payment') {
      return typeof value === 'number' 
        ? `$${value.toFixed(2)}` 
        : value;
    }
    
    return value.toString();
  };

  const headers = getHeaders();

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted">
            {headers.map((header, index) => (
              <th key={index} className="p-2 text-left font-medium text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
              {headers.map((header, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`} className="p-2 border-t">
                  {getValue(item, header)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChangeComparison;