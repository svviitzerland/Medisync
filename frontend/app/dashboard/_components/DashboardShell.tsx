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
  fo: [
    { label: "Queue & Registration", icon: ClipboardList, tab: null },
    { label: "FO Reports", icon: FileText, tab: "reports" },
  ],
  doctor_specialist: [
    { label: "Patient List", icon: Stethoscope, tab: null },
    { label: "My Schedule", icon: Calendar, tab: "schedule" },
  ],
  nurse: [
    { label: "Ward Monitor", icon: BedDouble, tab: null },
    { label: "Shift Schedule", icon: Clock, tab: "shift" },
  ],
  pharmacist: [
    { label: "Prescription Requests", icon: Pill, tab: null },
    { label: "Inventory", icon: Package, tab: "inventory" },
  ],
  patient: [
    { label: "Medical Status", icon: Activity, tab: null },
    { label: "Pre-Assessment", icon: ClipboardCheck, tab: "pre-assessment" },
    { label: "Billing History", icon: CreditCard, tab: "billing" },
    { label: "Ask AI", icon: MessageCircle, tab: "chat" },
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col",
          "border-r border-border/50 bg-card/95 backdrop-blur-md",
          "transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
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
        <div className="border-b border-border/40 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase text-foreground">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className={cn("text-xs font-medium", roleColors[user.role])}>
                {roleLabels[user.role]}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "transition-colors duration-150",
                  isActive
                    ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="size-3 opacity-60" />}
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

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-card/60 px-4 backdrop-blur-sm sm:px-6">
          <button
            className="text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-foreground">
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

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
