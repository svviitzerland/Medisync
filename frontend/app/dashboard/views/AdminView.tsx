"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Stethoscope,
  Ticket,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/config";
import { getAdminStats, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { AdminStats, StaffMember, Invoice } from "@/types";

export default function AdminView({ userId: _userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (activeTab === "overview" || activeTab === null) fetchStats();
    else if (activeTab === "staff") fetchStaff();
    else if (activeTab === "finance") fetchFinance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function fetchStats() {
    setLoading(true);
    try {
      const data = await getAdminStats();
      setStats(data);
      return;
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      // Fall back to direct Supabase queries
    }

    const [patientsRes, doctorsRes, ticketsRes, invoicesRes] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "patient"),
        supabase.from("doctors").select("id", { count: "exact", head: true }),
        supabase.from("tickets").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("medicine_fee, room_fee, doctor_fee"),
      ]);

    const revenue = (invoicesRes.data ?? []).reduce(
      (
        sum: number,
        inv: { medicine_fee: number; room_fee: number; doctor_fee: number },
      ) =>
        sum +
        (inv.medicine_fee ?? 0) +
        (inv.room_fee ?? 0) +
        (inv.doctor_fee ?? 0),
      0,
    );

    setStats({
      totalPatients: patientsRes.count ?? 0,
      totalDoctors: doctorsRes.count ?? 0,
      totalTickets: ticketsRes.count ?? 0,
      totalRevenue: revenue,
    });
    setLoading(false);
  }

  async function fetchStaff() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, name, role, email, phone, created_at")
      .neq("role", "patient")
      .order("role");
    setStaff((data as StaffMember[]) ?? []);
    setLoading(false);
  }

  async function fetchFinance() {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select(
        "id, doctor_fee, medicine_fee, room_fee, total_amount, status, issued_at, tickets(id, profiles!patient_id(name))",
      )
      .order("issued_at", { ascending: false })
      .limit(50);
    setInvoices((data as unknown as Invoice[]) ?? []);
    setLoading(false);
  }

  // ---- OVERVIEW TAB ----
  if (activeTab === "overview" || activeTab === null) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Hospital Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time hospital metrics and statistics
          </p>
        </div>

        {loading || !stats ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card p-5 animate-pulse"
              >
                <div className="h-4 w-24 rounded bg-muted/60" />
                <div className="mt-3 h-8 w-16 rounded bg-muted/40" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Patients"
              value={stats.totalPatients.toLocaleString()}
              color="text-teal-400"
              bg="bg-teal-400/10"
            />
            <StatCard
              icon={Stethoscope}
              label="Total Doctors"
              value={stats.totalDoctors.toLocaleString()}
              color="text-sky-400"
              bg="bg-sky-400/10"
            />
            <StatCard
              icon={Ticket}
              label="Total Tickets"
              value={stats.totalTickets.toLocaleString()}
              color="text-violet-400"
              bg="bg-violet-400/10"
            />
            <StatCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              color="text-emerald-400"
              bg="bg-emerald-400/10"
            />
          </div>
        )}
      </div>
    );
  }

  // ---- STAFF TAB ----
  if (activeTab === "staff") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Staff Directory</h2>
            <p className="text-sm text-muted-foreground mt-1">
              All hospital staff members
            </p>
          </div>
          <button
            onClick={fetchStaff}
            className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <TableSkeleton cols={5} rows={6} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <Th>Name</Th>
                  <Th>Role</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Joined</Th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No staff members found
                    </td>
                  </tr>
                ) : (
                  staff.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            ROLE_COLORS[member.role] ??
                              "bg-muted text-muted-foreground",
                          )}
                        >
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {member.email}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {member.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {member.created_at
                          ? formatDateShort(member.created_at)
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ---- FINANCE TAB ----
  if (activeTab === "finance") {
    const totalRevenue = invoices.reduce(
      (s, inv) =>
        s +
        (inv.doctor_fee ?? 0) +
        (inv.medicine_fee ?? 0) +
        (inv.room_fee ?? 0),
      0,
    );
    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Finance</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Revenue overview and invoice records
            </p>
          </div>
          <button
            onClick={fetchFinance}
            className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>

        {!loading && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={TrendingUp}
              label="Total Revenue"
              value={formatCurrency(totalRevenue)}
              color="text-emerald-400"
              bg="bg-emerald-400/10"
            />
            <StatCard
              icon={CheckCircle2}
              label="Paid Invoices"
              value={paidCount.toString()}
              color="text-sky-400"
              bg="bg-sky-400/10"
            />
            <StatCard
              icon={XCircle}
              label="Unpaid Invoices"
              value={unpaidCount.toString()}
              color="text-rose-400"
              bg="bg-rose-400/10"
            />
          </div>
        )}

        {loading ? (
          <TableSkeleton cols={7} rows={8} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <Th>Invoice</Th>
                  <Th>Patient</Th>
                  <Th>Doctor Fee</Th>
                  <Th>Medicine Fee</Th>
                  <Th>Room Fee</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{inv.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {inv.tickets?.profiles?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(inv.doctor_fee ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(inv.medicine_fee ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(inv.room_fee ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.issued_at ? formatDateShort(inv.issued_at) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ---- Shared Sub-components ----

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            bg,
          )}
        >
          <Icon className={cn("size-4", color)} />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-400",
    unpaid: "bg-rose-500/15 text-rose-400",
    pending: "bg-amber-500/15 text-amber-400",
    completed: "bg-sky-500/15 text-sky-400",
    inpatient: "bg-violet-500/15 text-violet-400",
    operation: "bg-rose-500/15 text-rose-400",
    waiting_pharmacy: "bg-amber-500/15 text-amber-400",
    assigned_doctor: "bg-sky-500/15 text-sky-400",
    draft: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        map[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </th>
  );
}

function TableSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden animate-pulse">
      <div className="h-10 bg-muted/30 border-b border-border/50" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3 border-b border-border/20 last:border-0"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 flex-1 rounded bg-muted/30" />
          ))}
        </div>
      ))}
    </div>
  );
}
