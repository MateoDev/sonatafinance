import { AlertTriangle, Key, LogOut, Loader2 } from "lucide-react";
import { useDevAuth } from "@/hooks/use-dev-auth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export function DevModeToggle() {
  const { enableDevBypass, toggleDevBypass } = useDevAuth();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Handle auth provider not being available yet
  let user = null;
  let devLoginMutation = { mutateAsync: async () => {} };
  let logoutMutation = { mutateAsync: async () => {} };
  
  try {
    const auth = useAuth();
    user = auth.user;
    devLoginMutation = auth.devLoginMutation;
    logoutMutation = auth.logoutMutation;
  } catch (e) {
    // Auth provider not available, use dev login button from window object
    console.log('Auth provider not available yet');
  }
  
  const handleDevLogin = async () => {
    setIsLoggingIn(true);
    try {
      await devLoginMutation.mutateAsync();
      // Mutation does the redirect in its success handler
    } catch (error) {
      toast({
        title: "Developer login failed",
        description: "Check console for details",
        variant: "destructive"
      });
      setIsLoggingIn(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      // Mutation does the redirect in its success handler
    } catch (error) {
      console.error("Logout error:", error);
      // Force navigation to root
      window.location.href = '/';
    }
  };
  
  // Ensure the dev toggle is visible regardless of styling
  useEffect(() => {
    // Create a persistent flag in localStorage
    localStorage.setItem('dev_toggle_visible', 'true');
  }, []);
  
  const isDevUser = user?.username === 'developer';
  
  return (
    <div className={`fixed bottom-4 left-4 z-[9999] p-4 rounded-md shadow-lg border-2 ${
      enableDevBypass || isDevUser ? 'bg-amber-100 border-amber-400 dark:bg-amber-950' : 'bg-slate-100 border-slate-300 dark:bg-slate-800'
    }`} style={{
      minWidth: '220px', 
      boxShadow: '0 0 15px rgba(0,0,0,0.2)'
    }}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${
            enableDevBypass || isDevUser ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
          }`} />
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={enableDevBypass || isDevUser} 
                onCheckedChange={toggleDevBypass}
                className={enableDevBypass || isDevUser ? 'bg-amber-500' : ''}
              />
              <Label className="font-medium">Developer Mode</Label>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isDevUser ? 'Logged in as Developer' : enableDevBypass ? 'Using mock data' : 'Using real data'}
            </span>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        {isDevUser ? (
          <Button 
            variant="outline"
            onClick={handleLogout}
            size="sm"
            className="border-dashed border-red-300 hover:bg-red-50 text-red-700"
          >
            <LogOut className="mr-2 h-4 w-4 text-red-500" />
            Log Out Developer
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={handleDevLogin}
            size="sm"
            disabled={isLoggingIn}
            className="border-dashed border-amber-300 hover:bg-amber-50 text-amber-700"
          >
            {isLoggingIn ? (
              <Loader2 className="mr-2 h-4 w-4 text-amber-500 animate-spin" />
            ) : (
              <Key className="mr-2 h-4 w-4 text-amber-500" />
            )}
            {isLoggingIn ? 'Logging in...' : 'Force Developer Login'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function DevLoginButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle auth provider not being available yet
  let devLoginMutation = { mutateAsync: async () => {} };
  
  try {
    const auth = useAuth();
    devLoginMutation = auth.devLoginMutation;
  } catch (e) {
    // Auth provider not available, use dev login button from window object
    console.log('Auth provider not available yet in DevLoginButton');
  }
  
  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      await devLoginMutation.mutateAsync();
      // Mutation handles redirection in its success callback
    } catch (error) {
      toast({
        title: "Developer login failed",
        description: "Check console for details",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      variant="outline"
      onClick={handleDevLogin}
      disabled={isLoading}
      className="w-full mt-2 border-2 border-dashed border-amber-300 hover:bg-amber-50 py-6"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-5 w-5 text-amber-500 animate-spin" />
      ) : (
        <Key className="mr-2 h-5 w-5 text-amber-500" />
      )}
      <span className="text-amber-700 font-semibold">
        {isLoading ? 'Logging in...' : 'Developer Login'}
      </span>
    </Button>
  );
}