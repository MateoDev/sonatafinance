import { useAuth } from "@/hooks/use-auth";
import { useDevAuth } from "@/hooks/use-dev-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";

// Create a cache to store authentication state
const authCache = {
  isAuthenticated: false,
  route: '',
};

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const { enableDevBypass, mockUser } = useDevAuth();
  const [, navigate] = useLocation();
  const [showLoader, setShowLoader] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Check if the route should be accessible
  // Either the user is authenticated, or dev bypass is enabled with a mock user
  const isAuthenticated = !!user || (enableDevBypass && !!mockUser);
  
  // On first load, check session storage
  useEffect(() => {
    const wasAuthenticated = sessionStorage.getItem('wasAuthenticated') === 'true';
    const dashboardAccessible = localStorage.getItem('dashboard_accessible') === 'true';
    
    // If we've already finished loading and checking auth
    if (!isLoading) {
      // Set auth checked to true so we know we've completed the check
      if (!authChecked) {
        setAuthChecked(true);
      }
      
      // If we're on dashboard path, ensure we use appropriate auth
      if (path === "/dashboard" && dashboardAccessible) {
        console.log("Dashboard previously accessible, maintaining access");
      }
      
      // Auto-retry authentication if we were previously authenticated but now we're not
      // This helps with page refreshes and navigation
      if (wasAuthenticated && !isAuthenticated) {
        // Keep showing loader for extra time to allow for auth check
        const timer = setTimeout(() => {
          setShowLoader(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      } else {
        setShowLoader(false);
      }
    }
  }, [isAuthenticated, isLoading, path, authChecked]);
  
  // Set authentication state in our cache when it changes
  useEffect(() => {
    authCache.isAuthenticated = isAuthenticated;
    
    // If we're authenticated and we load a protected route,
    // store the current route in the cache
    if (isAuthenticated && path === "/dashboard" && window.location.pathname === "/dashboard") {
      // Special handling for the dashboard path, ensure dashboard routes properly
      authCache.route = "/dashboard";
      console.log("Dashboard path cached properly:", path);
    } else if (isAuthenticated && window.location.pathname.startsWith(path)) {
      authCache.route = window.location.pathname;
    }
    
    // When authentication is confirmed, store in sessionStorage as well
    if (isAuthenticated) {
      sessionStorage.setItem('wasAuthenticated', 'true');
      
      // Special case for dashboard
      if (path === "/dashboard") {
        localStorage.setItem('dashboard_accessible', 'true');
      }
    }
  }, [isAuthenticated, path]);

  // Show loading state while checking authentication or in retry period
  if (isLoading || showLoader) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border mb-4" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </Route>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Special handling for dashboard route
    if (path === "/dashboard") {
      console.log("User not authenticated, redirecting from dashboard to login");
      localStorage.removeItem('dashboard_accessible');
    }
    
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }
  
  // Special handling for successful dashboard authentication
  if (isAuthenticated && path === "/dashboard") {
    console.log("User authenticated for dashboard successfully");
    localStorage.setItem('dashboard_accessible', 'true');
  }

  // User is authenticated, render the component
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}