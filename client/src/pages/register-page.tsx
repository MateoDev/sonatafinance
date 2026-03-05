import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, LockKeyhole, Info } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { SiGoogle } from "react-icons/si";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Separator } from "@/components/ui/separator";

// Registration form schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { user, registerMutation } = useAuth();
  const { handleGoogleSignIn, loading: firebaseLoading } = useFirebaseAuth();
  
  // Register form setup
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Redirect to="/dashboard" />;
  }

  // Registration form submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registrationData } = data;
    registerMutation.mutate(registrationData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
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
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-light mb-2">
              Create your account
            </CardTitle>
            <CardDescription>
              Join Sonata to start managing your finances
            </CardDescription>
          </CardHeader>
          
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <CardContent className="space-y-4 px-0">
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-500">Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="border-neutral-300" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
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
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-500">Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} className="border-neutral-300" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-500">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="border-neutral-300" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-500">Confirm password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="border-neutral-300" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="px-0">
                <Button 
                  type="submit" 
                  className="w-full bg-neutral-900 hover:bg-black text-white py-5 h-auto rounded-full transition-all font-normal shadow-sm hover:shadow-md"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </CardFooter>
                
              <div className="mt-6">
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center border-neutral-300 hover:bg-neutral-100 py-5 h-auto rounded-full transition-all font-normal"
                    onClick={handleGoogleSignIn}
                    disabled={firebaseLoading}
                  >
                    {firebaseLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SiGoogle className="mr-2 h-4 w-4" />
                    )}
                    Sign up with Google
                  </Button>
                  <div className="text-xs text-center text-muted-foreground">
                    <span className="flex items-center justify-center">
                      <Info className="h-3 w-3 mr-1" />
                      To enable Google sign-up, add this domain to Firebase authorized domains
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </Form>
          
          <div className="pt-6 text-center text-sm text-neutral-500">
            <div className="flex items-center justify-center mb-4">
              <LockKeyhole className="h-3 w-3 mr-1" />
              <span>Your financial data is private and secure</span>
            </div>
            <p>
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-neutral-900 hover:underline font-medium cursor-pointer">
                  Sign in
                </span>
              </Link>
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}