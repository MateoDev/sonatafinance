import { createContext, ReactNode, useContext, useCallback, useEffect, useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useActiveAccount, useDisconnect } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb";

// Session token storage
const TOKEN_KEY = "sonata_session_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Authenticated fetch helper
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", "application/json");
  return fetch(url, { ...options, headers });
}

type ProfileUpdateData = {
  name?: string;
  email?: string;
  profileImage?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (walletAddress: string, email?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileMutation: UseMutationResult<User, Error, ProfileUpdateData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { disconnect } = useDisconnect();
  const account = useActiveAccount();

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await authFetch("/api/user");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          clearToken();
        }
      } catch {
        clearToken();
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  // Auto-login when ThirdWeb account connects
  useEffect(() => {
    if (account?.address && !user && !isLoading) {
      login(account.address);
    }
  }, [account?.address]);

  const login = useCallback(async (walletAddress: string, email?: string, name?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/thirdweb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, email, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Authentication failed");
      }

      const { user: userData, token } = await res.json();
      setToken(token);
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);

      // Check if this is a new user who needs onboarding
      const isNewUser = !userData.name || userData.name === "" || userData.username?.startsWith("wallet_");
      if (isNewUser) {
        window.location.href = "/onboarding";
        return;
      }

      toast({
        title: "Welcome back!",
        description: `Signed in as ${userData.name || userData.username || walletAddress.slice(0, 8) + "..."}`,
      });
    } catch (err: any) {
      setError(err);
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  const logout = useCallback(async () => {
    try {
      await authFetch("/api/logout", { method: "POST" });
    } catch {}
    clearToken();
    setUser(null);
    queryClient.resetQueries();
    queryClient.setQueryData(["/api/user"], null);
    
    // Disconnect ThirdWeb wallet
    try {
      if (account) {
        disconnect(account as any);
      }
    } catch {}

    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  }, [disconnect, account, toast]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileUpdateData) => {
      const res = await authFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(profileData),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      setUser(updatedUser);
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, updateProfileMutation }}>
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
