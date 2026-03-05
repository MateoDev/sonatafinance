/**
 * Formats a number as currency with consistent decimal places
 * @param amount The number to format
 * @param currency The currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  // Handle null, undefined or empty values
  if (amount === null || amount === undefined || amount === '') {
    return '$0.00';
  }
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle NaN
  if (isNaN(numericAmount)) {
    return '$0.00';
  }
  
  // Format with 2 decimal places
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
}

/**
 * Formats a number to a specified number of decimal places
 * @param value The number to format
 * @param decimals The number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(value: number | string | null | undefined, decimals: number = 2): string {
  // Handle null, undefined or empty values
  if (value === null || value === undefined || value === '') {
    return '0.00';
  }
  
  // Convert to number if it's a string
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN
  if (isNaN(numericValue)) {
    return '0.00';
  }
  
  // Format with specified decimal places
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numericValue);
}

/**
 * Formats a percentage value
 * @param value The percentage value to format
 * @param decimals The number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | string | null | undefined, decimals: number = 2): string {
  // Handle null, undefined or empty values
  if (value === null || value === undefined || value === '') {
    return '0.00%';
  }
  
  // Convert to number if it's a string
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN
  if (isNaN(numericValue)) {
    return '0.00%';
  }
  
  // Format with specified decimal places
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numericValue / 100);
}