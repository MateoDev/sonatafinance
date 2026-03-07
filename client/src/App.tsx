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
import Onboarding from "@/pages/onboarding";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Chat from "@/pages/Chat";
import Notes from "@/pages/Notes";
import CashFlow from "@/pages/CashFlow";
import Subscriptions from "@/pages/Subscriptions";
import Agent from "@/pages/Agent";
import AppLayout from "@/components/layout/AppLayout";

function ProtectedWithLayout({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

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
        <Route path="/onboarding">
          <Onboarding />
        </Route>

        {/* Protected routes with sidebar layout */}
        <ProtectedRoute path="/dashboard" component={() => <ProtectedWithLayout component={Dashboard} />} />
        <ProtectedRoute path="/investments" component={() => <ProtectedWithLayout component={Investments} />} />
        <ProtectedRoute path="/investments/new" component={() => <ProtectedWithLayout component={NewInvestment} />} />
        <ProtectedRoute path="/budget" component={() => <ProtectedWithLayout component={Budget} />} />
        <ProtectedRoute path="/liabilities" component={() => <ProtectedWithLayout component={Liabilities} />} />
        <ProtectedRoute path="/liabilities/new" component={() => <ProtectedWithLayout component={NewLiability} />} />
        <ProtectedRoute path="/goals" component={() => <ProtectedWithLayout component={GoalsPage} />} />
        <ProtectedRoute path="/cashflow" component={() => <ProtectedWithLayout component={CashFlow} />} />
        <ProtectedRoute path="/subscriptions" component={() => <ProtectedWithLayout component={Subscriptions} />} />
        <ProtectedRoute path="/agent" component={() => <ProtectedWithLayout component={Agent} />} />
        <ProtectedRoute path="/profile" component={() => <ProtectedWithLayout component={Profile} />} />
        <ProtectedRoute path="/settings" component={() => <ProtectedWithLayout component={Settings} />} />
        <ProtectedRoute path="/chat" component={() => <ProtectedWithLayout component={Chat} />} />
        <ProtectedRoute path="/notes" component={() => <ProtectedWithLayout component={Notes} />} />

        {/* Catch-all */}
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </TooltipProvider>
  );
}

export default App;
