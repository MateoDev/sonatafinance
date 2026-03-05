import React from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Investments from "@/pages/Investments";
import NewInvestment from "@/pages/NewInvestment";
import Budget from "@/pages/Budget";
import Liabilities from "@/pages/Liabilities";
import NewLiability from "@/pages/NewLiability";
import GoalsPage from "@/pages/GoalsPage";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Chat from "@/pages/Chat";
import Notes from "@/pages/Notes";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Switch>
        {/* Public routes */}
        <Route path="/">
          <LandingPage />
        </Route>
        <Route path="/auth">
          <AuthPage />
        </Route>
        <Route path="/login">
          <AuthPage />
        </Route>

        {/* Protected routes */}
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/investments" component={Investments} />
        <ProtectedRoute path="/investments/new" component={NewInvestment} />
        <ProtectedRoute path="/budget" component={Budget} />
        <ProtectedRoute path="/liabilities" component={Liabilities} />
        <ProtectedRoute path="/liabilities/new" component={NewLiability} />
        <ProtectedRoute path="/goals" component={GoalsPage} />
        <ProtectedRoute path="/profile" component={Profile} />
        <ProtectedRoute path="/settings" component={Settings} />
        <ProtectedRoute path="/chat" component={Chat} />
        <ProtectedRoute path="/notes" component={Notes} />

        {/* Catch-all */}
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </TooltipProvider>
  );
}

export default App;
