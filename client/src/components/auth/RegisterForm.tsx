// Legacy component - redirects to unified auth page
import { useEffect } from "react";
import { useLocation } from "wouter";

export function RegisterForm() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/auth"); }, []);
  return null;
}
