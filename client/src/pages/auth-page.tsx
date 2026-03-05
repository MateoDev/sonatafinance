import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ConnectButton } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb";
import Logo from "@/components/brand/Logo";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // If user is already authenticated, redirect to dashboard
  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 to-neutral-900 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-10">
          <Logo size="lg" variant="full" />
          <h1 className="text-3xl font-light text-white mt-8 tracking-tight">
            Welcome to Sonata
          </h1>
          <p className="text-neutral-400 mt-3 text-lg">
            Connect your wallet or sign in with email to get started.
          </p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex justify-center">
            <ConnectButton
              client={thirdwebClient}
              theme="dark"
              connectModal={{
                title: "Sign in to Sonata",
                size: "compact",
                showThirdwebBranding: false,
              }}
              connectButton={{
                label: "Connect Wallet or Sign In",
                style: {
                  backgroundColor: "#fff",
                  color: "#000",
                  borderRadius: "9999px",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "500",
                  width: "100%",
                  maxWidth: "320px",
                },
              }}
            />
          </div>

          <p className="text-neutral-500 text-sm mt-6">
            Supports MetaMask, WalletConnect, Coinbase Wallet, and email/social login.
          </p>
        </div>

        <p className="text-neutral-600 text-xs mt-8">
          By connecting, you agree to the Sonata Finance Terms of Service.
        </p>
      </div>
    </div>
  );
}
