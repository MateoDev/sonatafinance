// This is a helper function to generate performance history data
export function generatePerformanceData(direction = 'up'): number[] {
  // Create a sample array with 10 data points
  const data: number[] = [];
  let value = 20 + Math.random() * 10;
  
  for (let i = 0; i < 10; i++) {
    if (direction === 'up') {
      value += Math.random() * 3 - 0.5; // Mostly up
    } else if (direction === 'down') {
      value -= Math.random() * 3 - 0.5; // Mostly down
    } else {
      value += Math.random() * 2 - 1; // Random fluctuation
    }
    
    // Keep value reasonable
    value = Math.max(5, Math.min(50, value));
    data.push(Math.round(value));
  }
  
  return data;
}