import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { ThirdwebProvider } from "thirdweb/react";
import { Toaster } from "@/components/ui/toaster";

// Set page title
document.title = "Sonata - Personal Finance";

// Add meta description for SEO
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content =
  "Manage your personal finances with Sonata - a minimalist finance tracker with AI-powered insights.";
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(
  <ThirdwebProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  </ThirdwebProvider>
);
