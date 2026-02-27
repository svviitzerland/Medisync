"use client";

import * as React from "react";
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  fullName: string;
  email: string;
  nik: string;
  phone: string;
  age: string;
  password: string;
  confirmPassword: string;
}

// ─── RegisterForm ─────────────────────────────────────────────────────────────

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>({
    fullName: "",
    email: "",
    nik: "",
    phone: "",
    age: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }

  function validate(): string | null {
    if (!form.fullName.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email address is required.";
    if (!/^\d{16}$/.test(form.nik)) return "NIK must be exactly 16 digits.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) <= 0))
      return "Age must be a positive number.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Sign up with Supabase Auth — role is always patient
      // The database trigger will automatically create the profile using this metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            role: "patient",
            name: form.fullName.trim(),
            nik: form.nik,
            phone: form.phone.trim(),
            ...(form.age ? { age: Number(form.age) } : {}),
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError("Registration failed. Please try again.");
        return;
      }

      setSuccess(true);

      // Redirect to dashboard after a short delay so user sees the success message
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <Card className="shadow-xl border-border/60 bg-card/80 backdrop-blur-sm text-center">
          <CardContent className="pt-8 pb-7 flex flex-col items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="size-6 text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Account created!
            </h2>
            <p className="text-sm text-muted-foreground">
              Redirecting you to your dashboard…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <Card className="shadow-xl border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-border/40">
          <CardTitle className="text-lg font-semibold">
            Create Patient Account
          </CardTitle>
          <CardDescription>
            Register as a patient to access Medisync services
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                required
                value={form.fullName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* NIK */}
            <div className="space-y-1.5">
              <Label htmlFor="nik">
                NIK{" "}
                <span className="text-xs text-muted-foreground">
                  (16-digit national ID)
                </span>
              </Label>
              <Input
                id="nik"
                name="nik"
                type="text"
                inputMode="numeric"
                maxLength={16}
                placeholder="1234567890123456"
                required
                value={form.nik}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Phone & Age (side by side) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+62 812 3456 7890"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="age">
                  Age{" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={150}
                  placeholder="25"
                  value={form.age}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  required
                  value={form.password}
                  onChange={handleChange}
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="pr-9"
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className={cn(
                    "absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
                    "hover:text-foreground transition-colors focus:outline-none",
                  )}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Role badge — read-only, always patient */}
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Registering as
              </span>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/25">
                Patient
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 mt-1"
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
                  Creating account…
                </span>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  Create account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
