"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  ClipboardList,
  FileText,
  Stethoscope,
  Calendar,
  BedDouble,
  Clock,
  Pill,
  Package,
  Activity,
  CreditCard,
  MessageCircle,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  HeartPulse,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, type UserRole } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

// ------- Navigation Config -------

type NavItem = {
  label: string;
  icon: React.ElementType;
  tab: string | null;
};

const roleNavItems: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Overview", icon: LayoutDashboard, tab: null },
    { label: "Staff Data", icon: Users, tab: "staff" },
    { label: "Finance", icon: DollarSign, tab: "finance" },
  ],
  fo: [{ label: "Queue & Registration", icon: ClipboardList, tab: null }],
  doctor_specialist: [{ label: "Patient List", icon: Stethoscope, tab: null }],
  nurse: [
    { label: "Ward Monitor", icon: BedDouble, tab: null },
    { label: "Shift Schedule", icon: Clock, tab: "shift" },
  ],
  pharmacist: [
    { label: "Prescription Requests", icon: Pill, tab: null },
    { label: "Inventory", icon: Package, tab: "inventory" },
  ],
  patient: [
    { label: "Health Check", icon: ClipboardCheck, tab: null },
    { label: "Chat with Doctor", icon: MessageCircle, tab: "chat" },
    { label: "Medical History", icon: Activity, tab: "visits" },
    { label: "Billing History", icon: CreditCard, tab: "billing" },
  ],
  agent: [{ label: "Overview", icon: LayoutDashboard, tab: null }],
};

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  fo: "Front Office",
  doctor_specialist: "Doctor",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  patient: "Patient",
  agent: "AI Agent",
};

const roleColors: Record<UserRole, string> = {
  admin: "text-rose-400",
  fo: "text-violet-400",
  doctor_specialist: "text-sky-400",
  nurse: "text-emerald-400",
  pharmacist: "text-amber-400",
  patient: "text-teal-400",
  agent: "text-indigo-400",
};

// ------- Main Shell -------

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  const [user, setUser] = React.useState<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const meta = session.user.user_metadata;
      setUser({
        id: session.user.id,
        email: session.user.email ?? "",
        name: meta?.name ?? meta?.full_name ?? session.user.email ?? "User",
        role: (meta?.role ?? "patient") as UserRole,
      });
      setLoading(false);
    }
    checkSession();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = roleNavItems[user.role] ?? [];
  const activeNavItem = navItems.find((i) =>
    i.tab === null ? !activeTab : activeTab === i.tab,
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background relative selection:bg-primary/20">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl opacity-50" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Floating style */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden",
          "lg:m-4 lg:rounded-2xl lg:h-[calc(100vh-2rem)]",
          "border border-border/40 bg-card/90 backdrop-blur-xl shadow-2xl shadow-black/10",
          "transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/40 px-5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <HeartPulse className="size-4 text-primary" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            Medisync
          </span>
          <button
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* User profile */}
        <div className="border-b border-border/30 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-muted to-muted/50 text-sm font-bold uppercase text-foreground shadow-sm ring-1 ring-border/50">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p
                className={cn(
                  "text-xs font-medium tracking-wide mt-0.5",
                  roleColors[user.role],
                )}
              >
                {roleLabels[user.role]}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive =
              item.tab === null ? !activeTab : activeTab === item.tab;
            const href =
              item.tab === null ? "/dashboard" : `/dashboard?tab=${item.tab}`;
            return (
              <Link
                key={item.label}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  "transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "size-4 shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="size-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-border/40 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10 w-full min-w-0">
        {/* Topbar */}
        <header className="flex h-18 shrink-0 items-center justify-between gap-4 border-b border-border/20 bg-background/50 px-4 sm:px-8 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              className="flex size-9 items-center justify-center rounded-lg border border-border/40 bg-card text-muted-foreground hover:text-foreground lg:hidden shadow-sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-4" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {activeNavItem?.label ?? "Dashboard"}
            </h1>
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </header>

        {/* Page content with max-width container */}
        <main className="flex-1 overflow-y-auto scrollbar-none">
          <div className="mx-auto max-w-400 p-4 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
