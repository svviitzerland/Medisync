import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login — Medisync",
  description: "Sign in to your Medisync account",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 h-150 w-150 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-100 w-100 rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        {/* Logo mark */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6 text-primary"
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

      <LoginForm />
    </div>
  );
}
