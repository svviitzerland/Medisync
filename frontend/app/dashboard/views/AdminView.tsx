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
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { ROLE_COLORS, ROLE_LABELS, STATUS_COLORS } from "@/lib/config";
import {
  ViewLayout,
  ViewMain,
  ViewHeader,
  ViewContentCard,
} from "@/components/dashboard/view-layout";

import { supabase } from "@/lib/supabase";
import type { AdminStats, StaffMember, Invoice } from "@/types";

export default function AdminView({ userId: _userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = React.useState<
    { status: string; count: number }[]
  >([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (activeTab === "overview" || activeTab === null) fetchStats();
    else if (activeTab === "staff") fetchStaff();
    else if (activeTab === "finance") fetchFinance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function fetchStats() {
    setLoading(true);

    const [patientsRes, doctorsRes, ticketsRes, invoicesRes, allTicketsRes] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "patient"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "doctor_specialist"),
        supabase.from("tickets").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("medicine_fee, room_fee, doctor_fee"),
        supabase.from("tickets").select("status"),
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

    // Build ticket status breakdown
    const statusMap = new Map<string, number>();
    for (const t of allTicketsRes.data ?? []) {
      const s = t.status ?? "unknown";
      statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
    }
    setTicketsByStatus(
      Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
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
      <ViewLayout>
        <ViewMain>
          <ViewHeader
            title="Hospital Overview"
            description="Real-time hospital metrics and statistics"
          />

          <ViewContentCard>
            {loading || !stats ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border/50 bg-muted/20 p-6 animate-pulse shadow-sm"
                  >
                    <div className="h-4 w-24 rounded-full bg-muted/60 mb-4" />
                    <div className="h-10 w-20 rounded-lg bg-muted/40" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                <StatCard
                  icon={Users}
                  label="Total Patients"
                  value={stats.totalPatients.toLocaleString()}
                  color="text-teal-500"
                  bg="bg-teal-500/10 border border-teal-500/20"
                />
                <StatCard
                  icon={Stethoscope}
                  label="Total Doctors"
                  value={stats.totalDoctors.toLocaleString()}
                  color="text-sky-500"
                  bg="bg-sky-500/10 border border-sky-500/20"
                />
                <StatCard
                  icon={Ticket}
                  label="Total Tickets"
                  value={stats.totalTickets.toLocaleString()}
                  color="text-violet-500"
                  bg="bg-violet-500/10 border border-violet-500/20"
                />
                <StatCard
                  icon={DollarSign}
                  label="Total Revenue"
                  value={formatCurrency(stats.totalRevenue)}
                  color="text-emerald-500"
                  bg="bg-emerald-500/10 border border-emerald-500/20"
                />
              </div>
            )}
          </ViewContentCard>

          {/* Ticket status breakdown */}
          {!loading && ticketsByStatus.length > 0 && (
            <ViewContentCard>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="size-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Tickets by Status
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {ticketsByStatus.map(({ status, count }) => (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-background px-4 py-3 shadow-sm"
                  >
                    <span
                      className={cn(
                        "shrink-0 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-border/50 mr-2",
                        STATUS_COLORS[status] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {status.replace(/_/g, " ")}
                    </span>
                    <span className="text-lg font-black shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </ViewContentCard>
          )}
        </ViewMain>
      </ViewLayout>
    );
  }

  // ---- STAFF TAB ----
  if (activeTab === "staff") {
    return (
      <ViewLayout>
        <ViewMain>
          <ViewHeader
            title="Staff Directory"
            description="All hospital staff members"
          >
            <button
              onClick={fetchStaff}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors shadow-sm"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Refresh
            </button>
          </ViewHeader>

          <ViewContentCard>
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
                          className="py-12 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <Users className="size-8 opacity-30" />
                            <p>No staff members found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      staff.map((member) => (
                        <tr
                          key={member.id}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-5 py-4 font-bold text-foreground">
                            {member.name}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-border/50",
                                ROLE_COLORS[member.role] ??
                                  "bg-muted text-muted-foreground",
                              )}
                            >
                              {ROLE_LABELS[member.role] ?? member.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground font-medium">
                            {member.email}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground font-mono text-xs">
                            {member.phone ?? "—"}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground font-medium text-xs">
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
          </ViewContentCard>
        </ViewMain>
      </ViewLayout>
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
      <ViewLayout>
        <ViewMain>
          <ViewHeader
            title="Finance"
            description="Revenue overview and invoice records"
          >
            <button
              onClick={fetchFinance}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors shadow-sm"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Refresh
            </button>
          </ViewHeader>

          <ViewContentCard>
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  icon={TrendingUp}
                  label="Total Revenue"
                  value={formatCurrency(totalRevenue)}
                  color="text-emerald-500"
                  bg="bg-emerald-500/10 border border-emerald-500/20"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Paid Invoices"
                  value={paidCount.toString()}
                  color="text-sky-500"
                  bg="bg-sky-500/10 border border-sky-500/20"
                />
                <StatCard
                  icon={XCircle}
                  label="Unpaid Invoices"
                  value={unpaidCount.toString()}
                  color="text-rose-500"
                  bg="bg-rose-500/10 border border-rose-500/20"
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
                          className="py-12 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <DollarSign className="size-8 opacity-30" />
                            <p>No invoices found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-5 py-4 font-mono text-[10px] font-bold text-muted-foreground uppercase">
                            #{inv.id.slice(0, 8)}
                          </td>
                          <td className="px-5 py-4 font-bold text-foreground">
                            {inv.tickets?.profiles?.name ?? "—"}
                          </td>
                          <td className="px-5 py-4 font-medium font-mono text-muted-foreground text-xs">
                            {formatCurrency(inv.doctor_fee ?? 0)}
                          </td>
                          <td className="px-5 py-4 font-medium font-mono text-muted-foreground text-xs">
                            {formatCurrency(inv.medicine_fee ?? 0)}
                          </td>
                          <td className="px-5 py-4 font-medium font-mono text-muted-foreground text-xs">
                            {formatCurrency(inv.room_fee ?? 0)}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="px-5 py-4 text-muted-foreground font-medium text-xs">
                            {inv.issued_at
                              ? formatDateShort(inv.issued_at)
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </ViewContentCard>
        </ViewMain>
      </ViewLayout>
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
    <div
      className={cn(
        "rounded-2xl bg-card p-6 space-y-4 shadow-sm transition-all hover:shadow-md",
        bg,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl bg-background/50 shadow-sm border border-border/40",
            color,
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <p className="text-3xl font-black tracking-tight text-foreground">
        {value}
      </p>
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
        "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-border/50",
        map[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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
