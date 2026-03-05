import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, LineChart } from 'lucide-react';

export function PortfolioAnalysis() {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Handle analyzing the portfolio
  const handleAnalyze = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    
    try {
      // Call the portfolio analysis endpoint
      const response = await fetch('/api/chat/analyze-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.data.choices[0].message.content);
      } else {
        throw new Error(data.error || 'Failed to analyze portfolio');
      }
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to analyze your portfolio',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Financial Analysis
        </CardTitle>
        <CardDescription>
          Ask about your portfolio, monthly budget, net worth, or payment schedules
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., How is my monthly budget distributed? What's my current net worth? When are my next bill payments due? Which investments should I prioritize?"
              className="min-h-[100px]"
            />
          </div>
          
          {analysis && (
            <div className="rounded-md bg-muted p-4 mt-4">
              <h3 className="font-medium mb-2">Analysis:</h3>
              <div className="whitespace-pre-line text-sm">{analysis}</div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleAnalyze} 
          disabled={loading || !query.trim()} 
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <LineChart className="mr-2 h-4 w-4" /> Analyze Finances
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}