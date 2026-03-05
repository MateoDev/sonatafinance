import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Logo from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user, updateProfileMutation } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [step, setStep] = useState(1);

  if (!user) {
    navigate("/auth");
    return null;
  }

  // If user already has a name set, skip onboarding
  if (user.name && user.name.length > 0 && !user.name.startsWith("wallet_")) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        email: email.trim() || undefined,
      });
      navigate("/dashboard");
    } catch {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const walletShort = user.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : user.username;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 to-neutral-900 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Logo size="lg" variant="full" />
        </div>

        {step === 1 && (
          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white/60" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Welcome to Sonata</CardTitle>
              <CardDescription className="text-neutral-400 text-base">
                Connected as <span className="text-white font-mono text-sm">{walletShort}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-neutral-300">
                  What should we call you?
                </Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 h-12 text-lg"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && setStep(2)}
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full h-12 text-base bg-white text-black hover:bg-neutral-200 rounded-full"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="w-20 h-20 border-2 border-neutral-700">
                  <AvatarFallback className="bg-neutral-800 text-white text-2xl">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl text-white">Hey, {name} 👋</CardTitle>
              <CardDescription className="text-neutral-400 text-base">
                One more thing — add your email for notifications and recovery.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300">
                  Email <span className="text-neutral-500">(optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 h-12 text-lg"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-full"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 h-12 text-base bg-white text-black hover:bg-neutral-200 rounded-full"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Get Started"}
                  {!updateProfileMutation.isPending && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full text-neutral-500 text-sm hover:text-neutral-400 transition-colors"
              >
                Skip for now
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
