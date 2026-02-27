import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register — Medisync",
  description:
    "Create a patient account to access Medisync healthcare services.",
};

export default function RegisterPage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden bg-background">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden pointer-events-none -z-10"
      >
        <div className="absolute -top-32 left-1/2 h-150 w-150 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-100 w-100 rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="flex flex-col items-center gap-2 mb-8 text-center">
        {/* Logo mark */}
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-6 h-6 text-primary"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-3-3v6M4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Medisync
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-Powered Healthcare Synchronization
        </p>
      </div>

      <RegisterForm />
    </div>
  );
}
