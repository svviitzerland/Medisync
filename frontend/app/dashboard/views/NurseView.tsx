"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  BedDouble,
  RefreshCw,
  Clock,
  Activity,
  Users,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/config";
import { supabase } from "@/lib/supabase";
import type { WardPatient } from "@/types";

const SHIFT_SCHEDULE = [
  { shift: "Morning", time: "07:00 – 14:00", icon: "🌅" },
  { shift: "Afternoon", time: "14:00 – 21:00", icon: "🌤" },
  { shift: "Night", time: "21:00 – 07:00", icon: "🌙" },
];

export default function NurseView({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  const [patients, setPatients] = React.useState<WardPatient[]>([]);
  const [teamId, setTeamId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!activeTab || activeTab === "ward") fetchMyWards();
  }, [activeTab, userId]);

  async function fetchMyWards() {
    setLoading(true);

    // Get nurse's team
    const { data: nurseData } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", userId)
      .single();

    if (!nurseData?.team_id) {
      setLoading(false);
      return;
    }

    setTeamId(String(nurseData.team_id));

    const { data } = await supabase
      .from("tickets")
      .select(
        "id, status, room_id, created_at, profiles!patient_id(name, age), rooms(name, type)",
      )
      .eq("nurse_team_id", nurseData.team_id)
      .in("status", ["inpatient", "operation"])
      .order("created_at", { ascending: false });

    setPatients((data as unknown as WardPatient[]) ?? []);
    setLoading(false);
  }

  // ---- SHIFT TAB ----
  if (activeTab === "shift") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Shift Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Team assignments and shift overview
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {SHIFT_SCHEDULE.map((s) => {
            const isCurrentShift = (() => {
              const h = new Date().getHours();
              if (s.shift === "Morning") return h >= 7 && h < 14;
              if (s.shift === "Afternoon") return h >= 14 && h < 21;
              return h >= 21 || h < 7;
            })();
            return (
              <div
                key={s.shift}
                className={cn(
                  "rounded-xl border p-5 space-y-3 transition-colors",
                  isCurrentShift
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50 bg-card",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{s.icon}</span>
                  {isCurrentShift && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      Current
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{s.shift} Shift</p>
                  <p className="text-sm text-muted-foreground">{s.time}</p>
                </div>
                {teamId && (
                  <div className="text-sm text-muted-foreground">
                    Team {teamId} · {patients.length} active patients
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- WARD MONITOR (default) ----
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Ward Monitor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {teamId
              ? `Team ${teamId} — active inpatients`
              : "Loading your team…"}
          </p>
        </div>
        <button
          onClick={fetchMyWards}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10">
              <BedDouble className="size-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inpatient</p>
              <p className="text-xl font-bold">
                {patients.filter((p) => p.status === "inpatient").length}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10">
              <Stethoscope className="size-4 text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Operation</p>
              <p className="text-xl font-bold">
                {patients.filter((p) => p.status === "operation").length}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{patients.length}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-border/30 bg-card"
            />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-border/50 text-muted-foreground">
          <BedDouble className="size-10 opacity-30" />
          <p className="text-sm">No patients currently in ward</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="rounded-xl border border-border/40 bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {patient.profiles?.name ?? "Unknown Patient"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Age: {patient.profiles?.age ?? "—"}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0",
                    STATUS_COLORS[patient.status] ??
                    "bg-muted text-muted-foreground",
                  )}
                >
                  {patient.status?.replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <BedDouble className="size-3.5" />
                  {patient.rooms?.name ?? "No room assigned"}
                  {patient.rooms?.type && (
                    <span className="ml-1 text-xs opacity-70">
                      ({patient.rooms.type})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatDate(patient.created_at)}
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-border/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Activity className="size-3 inline mr-1" />
                    Check Vitals
                  </button>
                  <button className="rounded-lg border border-border/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    Report to Doctor
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
