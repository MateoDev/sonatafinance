import React, { useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ChatProvider } from "@/hooks/use-chat-context";
import { FirebaseAuthProvider } from "@/hooks/use-firebase-auth";

import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import Dashboard from "@/pages/Dashboard";
import Investments from "@/pages/Investments";
import NewInvestment from "@/pages/NewInvestment";
import Budget from "@/pages/Budget";
import Liabilities from "@/pages/Liabilities";
import NewLiability from "@/pages/NewLiability";
import GoalsPage from "@/pages/GoalsPage";
import LandingPage from "@/pages/landing-page";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Chat from "@/pages/Chat";
import Notes from "@/pages/Notes";
import ImageViewer from "@/pages/ImageViewer";

import FloatingChatButton from "@/components/chat/FloatingChatButton";
import { FloatingChatPanel } from "@/components/chat/FloatingChatPanel";

function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          {/* Auth routes */}
          <Route path="/login">
            <LoginForm />
          </Route>
          
          <Route path="/register">
            <RegisterForm />
          </Route>
          
          {/* Dashboard */}
          <Route path="/dashboard">
            <Dashboard />
          </Route>
          
          {/* Homepage */}
          <Route path="/">
            <LandingPage />
          </Route>
          
          {/* Catch-all */}
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
