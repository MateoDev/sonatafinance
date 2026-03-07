import { ArrowLeftRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CashFlow() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Cash In / Out</h1>
      <p className="text-neutral-400 mb-8">Track your income and expenses over time.</p>
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <ArrowLeftRight className="h-12 w-12 text-neutral-500 mb-4" />
          <p className="text-neutral-400 text-lg">Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
