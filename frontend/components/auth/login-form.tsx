"use client";

import * as React from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DevAccountSwitcher } from "@/components/auth/dev-account-switcher";

export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  function handleFillAccount(accountEmail: string, accountPassword: string) {
    setEmail(accountEmail);
    setPassword(accountPassword);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    // TODO: implement actual auth logic
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <Card className="border-border/60 bg-card/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-lg font-semibold">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@medisync.id"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-primary underline-offset-2 hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-9"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className={cn(
                    "absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
                    "hover:text-foreground transition-colors focus:outline-none",
                  )}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="mt-1 w-full gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="size-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <>
                  <LogIn className="size-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Dev account switcher — development only */}
      <DevAccountSwitcher onFill={handleFillAccount} />

      <p className="text-center text-xs text-muted-foreground">
        Protected by Medisync secure access
      </p>
    </div>
  );
}
