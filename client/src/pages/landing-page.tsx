import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import Logo from "@/components/brand/Logo";
import { ArrowRight, Check, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authFetch } from "@/hooks/use-auth";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authFetch("/api/user");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-neutral-50">
      {/* Header */}
      <header className="container mx-auto flex justify-between items-center py-6 px-6 md:px-8">
        <Logo size="md" variant="full" />
        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-600 hidden md:block">
              Welcome back, <span className="font-medium">{user.name || user.username}</span>
            </div>
            <Link href="/dashboard">
              <Button className="bg-neutral-900 hover:bg-black text-white px-5 py-2 h-10 font-normal transition-colors shadow-sm hover:shadow-md rounded-full flex items-center gap-2">
                Go to Dashboard
                <Avatar className="h-6 w-6 ml-1">
                  {user.profileImage && <AvatarImage src={user.profileImage} />}
                  <AvatarFallback className="text-xs bg-primary text-white">
                    {(user.name || user.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </Link>
          </div>
        ) : (
          <Link href="/auth">
            <Button className="bg-neutral-900 hover:bg-black text-white px-5 py-2 h-10 font-normal transition-colors shadow-sm hover:shadow-md rounded-full flex items-center gap-2">
              <Wallet className="h-4 w-4 mr-1" />
              Connect / Sign In
            </Button>
          </Link>
        )}
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex flex-col items-center justify-center px-6 py-16 md:py-20">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-600">
            Your financial life,<br />beautifully organized.
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-10 md:mb-12 max-w-2xl mx-auto">
            One elegant workspace for tracking investments, budgeting, and achieving your financial goals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/auth">
              <Button className="bg-neutral-900 hover:bg-black text-white text-base font-normal w-full sm:w-auto px-8 py-6 h-auto rounded-full shadow-sm hover:shadow-md transition-all">
                Get started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto text-left mt-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-3">
                <div className="bg-neutral-100 p-2 rounded-full mr-3">
                  <Check className="h-4 w-4 text-neutral-800" />
                </div>
                <h3 className="font-medium text-neutral-800">Intelligent Dashboard</h3>
              </div>
              <p className="text-neutral-600 text-sm">Complete financial overview with automated insights and personalized recommendations.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-3">
                <div className="bg-neutral-100 p-2 rounded-full mr-3">
                  <Check className="h-4 w-4 text-neutral-800" />
                </div>
                <h3 className="font-medium text-neutral-800">AI Financial Assistant</h3>
              </div>
              <p className="text-neutral-600 text-sm">Ask questions, add data, and get personalized advice from your financial sidekick.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-3">
                <div className="bg-neutral-100 p-2 rounded-full mr-3">
                  <Check className="h-4 w-4 text-neutral-800" />
                </div>
                <h3 className="font-medium text-neutral-800">Web3 Ready</h3>
              </div>
              <p className="text-neutral-600 text-sm">Connect with your wallet or email. Your data stays private and secure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-neutral-200">
        <div className="container mx-auto text-center text-neutral-500 text-sm">
          <div className="mb-2">
            <Logo size="sm" variant="full" />
          </div>
          © {new Date().getFullYear()} Sonata Finance. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
