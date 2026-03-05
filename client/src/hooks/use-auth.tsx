import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ProfileUpdateData = {
  name?: string;
  email?: string;
  profileImage?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  updateProfileMutation: UseMutationResult<User, Error, ProfileUpdateData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  name: string;
  email: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to Personal Finance Tracker, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Starting logout process");
      
      // Clear all local state immediately
      localStorage.clear();
      sessionStorage.clear();
      localStorage.removeItem('dashboard_accessible');
      sessionStorage.removeItem('wasAuthenticated');
      
      try {
        // Try to logout from the server
        const response = await apiRequest("POST", "/api/logout");
        if (!response.ok) {
          console.warn("Server logout returned non-200 status:", response.status);
        }
        return response;
      } catch (error) {
        console.error("Server logout failed, clearing client state anyway", error);
        // We'll continue with client-side logout even if the server request fails
      }
    },
    onSuccess: () => {
      // Clear all auth-related state
      queryClient.resetQueries();
      queryClient.setQueryData(["/api/user"], null);
      
      // Remove all storage data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any Firebase tokens
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('authUser');
      
      // Clear all dashboard access flags
      localStorage.removeItem('dashboard_accessible');
      localStorage.removeItem('user_role');
      localStorage.removeItem('wasAuthenticated');
      sessionStorage.removeItem('wasAuthenticated');
      
      // Attempt Firebase signout using our helper function
      try {
        import('../lib/firebase').then(({ firebaseSignOut }) => {
          firebaseSignOut().catch(e => console.error("Firebase signout error:", e));
        }).catch(e => console.log("Firebase module not available"));
      } catch (e) {
        console.log("Firebase import failed, continuing with logout");
      }
      
      // Show logout success notification
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      
      // Redirect to home page after logout
      setTimeout(() => {
        window.location.href = '/';
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: "There was an error during logout. Forcing logout now.",
        variant: "destructive",
      });
      
      // Clear state anyway
      queryClient.resetQueries();
      queryClient.setQueryData(["/api/user"], null);
      localStorage.clear();
      sessionStorage.clear();
      
      // Also try Firebase signout as a last resort
      try {
        import('../lib/firebase').then(({ firebaseSignOut }) => {
          firebaseSignOut().catch(e => console.error("Firebase signout error:", e));
        }).catch(e => console.log("Firebase module not available"));
      } catch (e) {
        console.log("Firebase import failed, continuing with logout");
      }
      
      // Force redirect to homepage
      setTimeout(() => {
        window.location.href = '/';
      }, 300);
    },
  });
  
  // Developer login mutation has been removed

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileUpdateData) => {
      const res = await apiRequest("PATCH", "/api/user/profile", profileData);
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}