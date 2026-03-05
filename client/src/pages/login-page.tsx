import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, LockKeyhole, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/brand/Logo";
import { SiGoogle } from "react-icons/si";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Separator } from "@/components/ui/separator";
// Removed DevLoginButton import

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { user, isLoading, loginMutation } = useAuth();
  const { handleGoogleSignIn, loading: firebaseLoading } = useFirebaseAuth();
  const { toast } = useToast();
  
  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Check for saved authentication in session storage as well
  const savedAuth = sessionStorage.getItem('wasAuthenticated');
  
  // Using a variable for conditional rendering instead of an early return
  // to avoid breaking React hook rules
  const shouldRedirect = user || (savedAuth && !isLoading);

  // Login form submission
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  // Forgot password form setup
  const [isResetLoading, setIsResetLoading] = useState(false);
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // Forgot password submission
  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    setIsResetLoading(true);
    try {
      // Call the server endpoint to request password reset
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });
      
      if (response.ok) {
        toast({
          title: "Password Reset Requested",
          description: "If an account with that email exists, a password reset link will be sent when email service is available.",
          variant: "default",
        });
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      toast({
        title: "Password Reset Error",
        description: "There was a problem with your password reset request. Please try again later.",
        variant: "destructive",
      });
      console.error('Password reset error:', error);
    } finally {
      setIsResetLoading(false);
      // Reset form and go back to login regardless of outcome
      forgotPasswordForm.reset();
      setShowForgotPassword(false);
    }
  };

  // Handle redirect if needed
  if (shouldRedirect) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header with logo */}
      <header className="container mx-auto py-6">
        <Link href="/">
          <div className="inline-block cursor-pointer">
            <Logo size="md" variant="full" />
          </div>
        </Link>
      </header>
      
      {/* Main content */}
      <main className="flex-grow flex items-center justify-center p-6">
        <Card className="w-full max-w-md border border-neutral-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-6 pt-6 px-6">
            <CardTitle className="text-2xl font-medium mb-3 bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
              {showForgotPassword ? "Reset password" : "Welcome to Sonata"}
            </CardTitle>
            <CardDescription className="text-neutral-500">
              {showForgotPassword 
                ? "Enter your email to request a password reset" 
                : "Sign in to continue to your financial workspace"}
            </CardDescription>
          </CardHeader>
          
          {showForgotPassword ? (
            <div className="space-y-4">
              <CardContent>
                <div className="flex items-center mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForgotPassword(false)}
                    className="p-0 h-auto text-neutral-500 hover:text-black hover:bg-transparent"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to login
                  </Button>
                </div>
                <Form {...forgotPasswordForm}>
                  <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-500">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} className="border-neutral-300" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-neutral-900 hover:bg-black text-white mt-4 py-5 h-auto rounded-full transition-all font-normal shadow-sm hover:shadow-md"
                      disabled={isResetLoading}
                    >
                      {isResetLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Request password reset"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </div>
          ) : (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <CardContent className="space-y-5 px-6">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-600 font-medium mb-1.5">Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} className="border-neutral-300 h-11" />
                        </FormControl>
                        <FormMessage className="text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-600 font-medium mb-1.5">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="border-neutral-300 h-11" />
                        </FormControl>
                        <FormMessage className="text-sm mt-1" />
                      </FormItem>
                    )}
                  />
                  <div className="text-right">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm font-normal text-neutral-500 hover:text-black"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowForgotPassword(true);
                      }}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="px-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-neutral-900 hover:to-black text-white py-5 h-auto rounded-full transition-all font-normal shadow-sm hover:shadow-md"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </CardFooter>
                
                <div className="mt-8 px-6">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-neutral-500">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 py-5 h-auto rounded-full transition-all font-normal shadow-sm"
                      onClick={handleGoogleSignIn}
                      disabled={firebaseLoading}
                    >
                      {firebaseLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Authenticating with Google...
                        </>
                      ) : (
                        <>
                          <SiGoogle className="mr-2 h-5 w-5 text-blue-500" />
                          Continue with Google
                        </>
                      )}
                    </Button>
                    {/* Removed Firebase domain message */}
                    {/* Removed developer mode login button */}
                  </div>
                </div>
              </form>
            </Form>
          )}
          
          <div className="py-6 px-6 text-center text-sm border-t border-neutral-100 mt-4">
            <div className="flex items-center justify-center mb-4">
              <LockKeyhole className="h-3 w-3 mr-1" />
              <span>Your financial data is private and secure</span>
            </div>
            <p>
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-neutral-900 hover:underline font-medium cursor-pointer">
                  Sign up
                </span>
              </Link>
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}