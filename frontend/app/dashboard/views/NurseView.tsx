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
import {
  ViewLayout,
  ViewMain,
  ViewHeader,
  ViewContentCard,
} from "@/components/dashboard/view-layout";
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
  const [teamName, setTeamName] = React.useState<string | null>(null);
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

    // Fetch team name
    const { data: teamData } = await supabase
      .from("nurse_teams")
      .select("name")
      .eq("id", nurseData.team_id)
      .single();
    if (teamData?.name) setTeamName(teamData.name);

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
      <ViewLayout>
        <ViewMain>
          <ViewHeader
            title="Shift Schedule"
            description="Team assignments and shift overview"
          />
          <ViewContentCard>
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
                      "rounded-2xl border p-5 space-y-4 transition-all duration-200",
                      isCurrentShift
                        ? "border-primary/30 bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                        : "border-border/50 bg-card hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-background border border-border/50 shadow-sm text-2xl">
                        {s.icon}
                      </div>
                      {isCurrentShift && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
                          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                          Current
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{s.shift} Shift</p>
                      <p className="text-sm font-medium text-muted-foreground mt-0.5">
                        {s.time}
                      </p>
                    </div>
                    {teamId && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40 text-sm">
                        <span className="font-semibold text-foreground/80">
                          {teamName ?? `Team ${teamId}`}
                        </span>
                        <span className="text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md text-xs font-medium">
                          {patients.length} active
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ViewContentCard>
        </ViewMain>
      </ViewLayout>
    );
  }

  // ---- WARD MONITOR (default) ----
  return (
    <ViewLayout>
      <ViewMain className="max-w-5xl">
        <ViewHeader
          title="Ward Monitor"
          description={
            teamName
              ? `${teamName} — active inpatients`
              : teamId
                ? `Team ${teamId} — active inpatients`
                : "Loading your team…"
          }
        >
          <button
            onClick={fetchMyWards}
            className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors shadow-sm"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </button>
        </ViewHeader>

        <ViewContentCard>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-border/30 bg-muted/20"
                />
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/50 bg-muted/5 text-muted-foreground">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted/50">
                <BedDouble className="size-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">
                No patients currently in ward
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-card hover:shadow-md transition-all duration-300 hover:border-primary/20"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                          {patient.profiles?.name ?? "Unknown Patient"}
                        </p>
                        <p className="text-xs font-medium text-muted-foreground">
                          Age: {patient.profiles?.age ?? "—"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-sm border border-border/50",
                          STATUS_COLORS[patient.status] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {patient.status?.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="rounded-xl bg-muted/30 p-3 border border-border/30">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <BedDouble className="size-4 text-primary" />
                        {patient.rooms?.name ?? "No room assigned"}
                      </div>
                      {patient.rooms?.type && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {patient.rooms.type}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 bg-muted/10 p-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="size-3.5" />
                      {formatDate(patient.created_at)}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex size-8 items-center justify-center rounded-lg border border-border/50 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                        <Activity className="size-4" />
                        <span className="sr-only">Check Vitals</span>
                      </button>
                      <button className="flex size-8 items-center justify-center rounded-lg border border-border/50 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                        <Stethoscope className="size-4" />
                        <span className="sr-only">Report to Doctor</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ViewContentCard>
      </ViewMain>
    </ViewLayout>
  );
}
