import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Agent() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-white mb-2">AI Agent</h1>
      <p className="text-neutral-400 mb-8">Your personal financial AI assistant.</p>
      <Card className="bg-neutral-800/50 border-neutral-700">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Bot className="h-12 w-12 text-neutral-500 mb-4" />
          <p className="text-neutral-400 text-lg">Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
