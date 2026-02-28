"use client";

import * as React from "react";
import {
  Search,
  UserPlus,
  Brain,
  Ticket,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  User,
  FileText,
  Stethoscope,
  UserCheck,
  BedDouble,
  ShieldAlert,
  Hash,
  ClipboardList,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS, SEVERITY_COLORS } from "@/lib/config";
import {
  analyzeTicket,
  createTicket,
  ApiError,
} from "@/lib/api";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ViewLayout,
  ViewMain,
  ViewHeader,
  ViewContentCard,
  ViewSection,
  ViewSidebar,
  ViewModal,
} from "@/components/dashboard/view-layout";
import type { AIAnalysis } from "@/types";

import { useSearchParams } from "next/navigation";

interface PatientInfo {
  id: string | null;
  name: string;
  isNew: boolean;
}

interface TicketRecord {
  id: string;
  fo_note: string;
  doctor_note: string | null;
  status: string;
  severity_level: string | null;
  room_id: string | null;
  ai_reasoning: string | null;
  nurse_team_id: string | null;
  created_at: string;
  profiles: { name: string; nik: string; age?: number } | null;
  doctor_profiles: { name: string; specialization?: string } | null;
}

export default function FOView({ userId: _userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const _activeTab = searchParams.get("tab");
  // NIK Search
  const [nikSearch, setNikSearch] = React.useState("");
  const [patientInfo, setPatientInfo] = React.useState<PatientInfo | null>(
    null,
  );
  const [searching, setSearching] = React.useState(false);

  // New patient form
  const [newName, setNewName] = React.useState("");
  const [newAge, setNewAge] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");

  // FO note & AI
  const [foNote, setFoNote] = React.useState("");
  const [analysis, setAnalysis] = React.useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [manualInpatient, setManualInpatient] = React.useState<boolean | null>(null);

  // Ticket creation
  const [creating, setCreating] = React.useState(false);
  const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Ticket list
  const [tickets, setTickets] = React.useState<TicketRecord[]>([]);
  const [loadingTickets, setLoadingTickets] = React.useState(false);

  // Modal for recent tickets
  const [selectedTicket, setSelectedTicket] =
    React.useState<TicketRecord | null>(null);

  React.useEffect(() => {
    fetchTickets();
  }, []);

  async function handleSearchNIK() {
    if (!nikSearch.trim()) return;
    setSearching(true);
    setPatientInfo(null);
    setAnalysis(null);
    setManualInpatient(null);
    setCreateSuccess(null);

    const { data } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("nik", nikSearch.trim())
      .eq("role", "patient")
      .single();

    if (data) {
      setPatientInfo({ id: data.id, name: data.name, isNew: false });
    } else {
      setPatientInfo({ id: null, name: "", isNew: true });
    }
    setSearching(false);
  }

  async function handleAnalyzeAI() {
    if (!foNote.trim()) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);

    try {
      const data = await analyzeTicket(foNote, patientInfo?.id ?? null);
      if (data.status === "success") {
        setAnalysis(data.analysis ?? null);
        setManualInpatient(data.analysis?.requires_inpatient ?? false);
      } else {
        setAnalysisError(data.message ?? "AI analysis failed");
      }
    } catch (err) {
      setAnalysisError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the AI service. Please try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleCreateTicket() {
    if (!patientInfo || !foNote.trim()) return;
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    let finalPatientId = patientInfo.id;

    // Register new patient if needed
    if (patientInfo.isNew) {
      try {
        const tempSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } }
        );

        const email = `${nikSearch}@medisync.local`;
        const password = `Password123!`;

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: "patient",
              nik: nikSearch,
              name: newName,
              age: parseInt(newAge),
              phone: newPhone,
            },
          },
        });

        if (authError) {
          setCreateError(authError.message || "Patient registration failed");
          setCreating(false);
          return;
        }

        if (authData.user?.id) {
          finalPatientId = authData.user.id;
        } else {
          setCreateError("Patient registration failed");
          setCreating(false);
          return;
        }
      } catch (err: any) {
        setCreateError(err.message || "Could not register new patient. Please try again.");
        setCreating(false);
        return;
      }
    }

    // Create ticket
    try {
      const payload = {
        patient_id: finalPatientId!,
        fo_note: foNote,
        ...(analysis && {
          doctor_id: analysis.recommended_doctor_id,
          requires_inpatient: manualInpatient ?? analysis.requires_inpatient,
          severity_level: analysis.severity_level,
          ai_reasoning: analysis.reasoning,
        }),
      };

      const data = await createTicket(payload);
      const nurseTeam = data.assigned_nurse_team;
      setCreateSuccess(
        nurseTeam
          ? `Ticket created! Assigned to nurse team: ${nurseTeam}`
          : "Ticket created successfully!",
      );
      // Reset form
      setNikSearch("");
      setPatientInfo(null);
      setFoNote("");
      setAnalysis(null);
      setManualInpatient(null);
      setNewName("");
      setNewAge("");
      setNewPhone("");
      fetchTickets();
    } catch (err) {
      setCreateError(
        err instanceof ApiError
          ? err.message
          : "Could not create ticket. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function fetchTickets() {
    setLoadingTickets(true);
    const { data } = await supabase
      .from("tickets")
      .select(
        "id, fo_note, doctor_note, status, severity_level, room_id, ai_reasoning, nurse_team_id, created_at, " +
          "profiles!patient_id(name, nik, age), doctor_profiles:profiles!doctor_id(name, specialization)",
      )
      .order("created_at", { ascending: false })
      .limit(20);
    setTickets((data as unknown as TicketRecord[]) ?? []);
    setLoadingTickets(false);
  }

  // ---- Queue & Registration ----
  return (
    <ViewLayout>
      {/* Main Column: Registration Form (Centered) */}
      <ViewMain>
        <ViewHeader
          title="Patient Registration"
          description="Register new patients or create examination tickets. Fill out the patient details and symptom assessment."
        />

        {/* Registration Form */}
        <ViewContentCard>
          {/* Step 1: NIK Search */}
          <ViewSection step="1" title="Search Patient">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter NIK (16-digit national ID)"
                  value={nikSearch}
                  onChange={(e) => setNikSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchNIK()}
                  maxLength={16}
                />
              </div>
              <Button
                onClick={handleSearchNIK}
                disabled={searching || !nikSearch.trim()}
              >
                {searching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                Search
              </Button>
            </div>

            {/* Patient result */}
            {patientInfo && (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3",
                  patientInfo.isNew
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-emerald-500/30 bg-emerald-500/5",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full",
                    patientInfo.isNew ? "bg-amber-500/20" : "bg-emerald-500/20",
                  )}
                >
                  {patientInfo.isNew ? (
                    <UserPlus className={cn("size-4", "text-amber-400")} />
                  ) : (
                    <User className={cn("size-4", "text-emerald-400")} />
                  )}
                </div>
                <div>
                  {patientInfo.isNew ? (
                    <p className="text-sm font-medium text-amber-400">
                      New patient — fill in details below
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-emerald-400">
                      Patient found:{" "}
                      <span className="text-foreground">
                        {patientInfo.name}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    NIK: {nikSearch}
                  </p>
                </div>
              </div>
            )}
          </ViewSection>

          {/* New patient form */}
          {patientInfo?.isNew && (
            <div className="pt-2 space-y-3">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                New Patient Details
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Patient full name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    placeholder="Age"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    min={0}
                    max={150}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="Phone number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Complaint note + AI Triage */}
          {patientInfo && (
            <ViewSection step="2" title="Complaint & AI Triage">
              <div className="space-y-3">
                <textarea
                  placeholder="Describe the patient's complaint (symptoms, duration, severity…)"
                  value={foNote}
                  onChange={(e) => setFoNote(e.target.value)}
                  rows={3}
                  className={cn(
                    "w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                    "resize-none transition-colors",
                  )}
                />
                <Button
                  variant="outline"
                  onClick={handleAnalyzeAI}
                  disabled={analyzing || !foNote.trim()}
                  className="gap-2"
                >
                  {analyzing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Brain className="size-4 text-primary" />
                  )}
                  Analyze with AI
                </Button>
              </div>

              {/* AI Analysis result */}
              {analysisError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  {analysisError}
                </div>
              )}

              {analysis && (
                <div className="p-4 space-y-4 border rounded-xl border-primary/20 bg-primary/5">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Brain className="size-4 text-primary" />
                    <span className="text-sm font-semibold">
                      AI Triage Result
                    </span>
                  </div>

                  {/* 2×2 grid of key fields */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Specialization */}
                    <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-background/60 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Stethoscope className="size-3.5" />
                        Specialization
                      </div>
                      <p className="font-semibold text-foreground">
                        {analysis.predicted_specialization ?? "—"}
                      </p>
                    </div>

                    {/* Recommended Doctor */}
                    <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-background/60 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <UserCheck className="size-3.5" />
                        Recommended Doctor
                      </div>
                      <p className="font-semibold text-foreground">
                        {analysis.recommended_doctor_name ?? "—"}
                      </p>
                    </div>

                    {/* Severity */}
                    <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-background/60 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <ShieldAlert className="size-3.5" />
                        Severity
                      </div>
                      <div>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                            SEVERITY_COLORS[analysis.severity_level] ??
                            "bg-muted text-muted-foreground border-border",
                          )}
                        >
                          {analysis.severity_level}
                        </span>
                      </div>
                    </div>

                    {/* Inpatient */}
                    <div className="flex flex-col justify-between gap-1 rounded-lg border border-border/40 bg-background/60 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <BedDouble className="size-3.5" />
                        Care Type (Editable)
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => setManualInpatient(false)}
                          className={cn(
                            "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors border",
                            manualInpatient === false
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-background text-muted-foreground hover:bg-muted border-border"
                          )}
                        >
                          Outpatient
                        </button>
                        <button
                          onClick={() => setManualInpatient(true)}
                          className={cn(
                            "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors border",
                            manualInpatient === true
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                              : "bg-background text-muted-foreground hover:bg-muted border-border"
                          )}
                        >
                          Inpatient
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                      AI Reasoning
                    </span>
                    <p className="text-sm leading-relaxed text-foreground/90 bg-background/60 border border-border/40 rounded-lg px-3 py-2.5">
                      {analysis.reasoning}
                    </p>
                  </div>
                </div>
              )}
            </ViewSection>
          )}

          {/* Step 3: Create Ticket */}
          {patientInfo && foNote.trim() && (
            <ViewSection step="3" title="Create Examination Ticket">
              {createSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0" />
                  {createSuccess}
                </div>
              )}
              {createError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertTriangle className="size-4 shrink-0" />
                  {createError}
                </div>
              )}

              <Button
                size="lg"
                onClick={handleCreateTicket}
                disabled={
                  creating ||
                  (patientInfo.isNew &&
                    (!newName.trim() || !newAge || !newPhone.trim()))
                }
                className="w-full gap-2 font-bold tracking-wide shadow-sm"
              >
                {creating ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Ticket className="mr-1 size-5" />
                )}
                {creating ? "Creating..." : "Create Examination Ticket"}
              </Button>
            </ViewSection>
          )}
        </ViewContentCard>
      </ViewMain>

      {/* Right Column: Recent Tickets Sidebar */}
      <ViewSidebar>
        <div className="flex items-center justify-between p-4 border shadow-sm bg-card/60 backdrop-blur-md rounded-2xl border-border/40">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Ticket className="size-5 text-primary" />
            </div>
            <h3 className="text-base font-bold">Recent Tickets</h3>
          </div>
          <button
            onClick={fetchTickets}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <RefreshCw
              className={cn("size-3.5", loadingTickets && "animate-spin")}
            />
            Refresh
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {loadingTickets ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="border h-26 animate-pulse rounded-2xl border-border/30 bg-card/40"
                />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-sm border border-dashed rounded-2xl border-border/40 bg-card/10 text-muted-foreground">
              <Ticket className="mb-3 size-8 opacity-20" />
              There are no recent tickets
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full text-left group relative flex flex-col gap-2 p-4 transition-all duration-200 border rounded-2xl border-border/40 bg-card/60 backdrop-blur-sm hover:bg-card hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between w-full">
                    <p className="pr-2 font-semibold truncate text-foreground">
                      {ticket.profiles?.name ?? "Unknown Patient"}
                    </p>
                    {ticket.severity_level && (
                      <span
                        className={cn(
                          "shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          SEVERITY_COLORS[ticket.severity_level] ??
                            "bg-muted text-muted-foreground border-border",
                        )}
                      >
                        {ticket.severity_level}
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.fo_note}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40">
                    <span
                      className={cn(
                        "inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        STATUS_COLORS[ticket.status] ??
                        "bg-muted text-muted-foreground border border-border",
                      )}
                    >
                      {ticket.status?.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ViewSidebar>

      {/* Ticket Details Modal overlays the whole viewport */}
      <ViewModal
        title="Ticket Details"
        description="Full ticket information and current status"
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        icon={<Ticket className="size-6" />}
      >
        {selectedTicket && (
          <>
            {/* Ticket ID */}
            <div className="flex items-center gap-2 px-3 py-2 border rounded-xl bg-muted/30 border-border/30">
              <Hash className="size-3.5 text-muted-foreground shrink-0" />
              <p className="font-mono text-xs truncate text-muted-foreground">
                {selectedTicket.id}
              </p>
            </div>

            {/* Patient Details */}
            <div className="flex flex-col gap-1 p-4 border rounded-2xl bg-muted/30 border-border/30">
              <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Patient
              </p>
              <p className="text-lg font-semibold text-foreground">
                {selectedTicket.profiles?.name ?? "Unknown Patient"}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                <span>NIK: {selectedTicket.profiles?.nik ?? "—"}</span>
                {selectedTicket.profiles?.age != null && (
                  <span>Age: {selectedTicket.profiles.age}</span>
                )}
              </div>
            </div>

            {/* Status + Severity + Care Type */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-muted/20 border border-border/30">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Care Type
                </p>
                <div>
                  {selectedTicket?.rooms ? (
                    <span className="inline-flex rounded-lg px-3 py-1 text-xs font-bold uppercase shadow-sm bg-rose-500/10 text-rose-500 border border-rose-500/30">
                      Inpatient ({selectedTicket.rooms.name})
                    </span>
                  ) : (
                    <span className="inline-flex rounded-lg px-3 py-1 text-xs font-bold uppercase shadow-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                      Outpatient
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-muted/20 border border-border/30">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Assigned Doctor
                </p>
                <p className="text-sm font-semibold">
                  {selectedTicket?.doctor ? (
                    <span className="text-foreground">
                      {selectedTicket.doctor.name}
                      <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                        {selectedTicket.doctor.specialization}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Pending Assignment
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-muted/20 border border-border/30">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Status
                </p>
                <span
                  className={cn(
                    "inline-flex w-fit rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase shadow-sm",
                    STATUS_COLORS[selectedTicket.status] ??
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {selectedTicket.status?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-muted/20 border border-border/30">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Severity
                </p>
                {selectedTicket.severity_level ? (
                  <span
                    className={cn(
                      "inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                      SEVERITY_COLORS[selectedTicket.severity_level] ??
                        "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {selectedTicket.severity_level}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-muted/20 border border-border/30">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Care Type
                </p>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    selectedTicket.room_id
                      ? "text-rose-400"
                      : "text-emerald-400",
                  )}
                >
                  {selectedTicket.room_id ? "Inpatient" : "Outpatient"}
                </span>
              </div>
            </div>

            {/* Assigned Doctor + Nurse Team */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-muted/20 border border-border/30">
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  <Stethoscope className="size-3.5" />
                  Doctor
                </div>
                {selectedTicket.doctor_profiles ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedTicket.doctor_profiles.name}
                    </p>
                    {selectedTicket.doctor_profiles.specialization && (
                      <p className="text-xs text-muted-foreground">
                        {selectedTicket.doctor_profiles.specialization}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Not assigned
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-muted/20 border border-border/30">
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  <Users className="size-3.5" />
                  Nurse Team
                </div>
                {selectedTicket.nurse_team_id ? (
                  <p className="text-sm font-semibold text-foreground">
                    {selectedTicket.nurse_team_id}
                  </p>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Not assigned
                  </span>
                )}
              </div>
            </div>

            {/* FO Complaint */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                <ClipboardList className="size-3.5" />
                Front Office Complaint
              </div>
              <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap border shadow-inner bg-background border-border/50 rounded-2xl text-foreground/90">
                {selectedTicket.fo_note}
              </div>
            </div>

            {/* AI Reasoning */}
            {selectedTicket.ai_reasoning && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  <Brain className="size-3.5" />
                  AI Reasoning
                </div>
                <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap border border-primary/20 bg-primary/5 rounded-2xl text-foreground/90">
                  {selectedTicket.ai_reasoning}
                </div>
              </div>
            )}

            {/* Doctor Note */}
            {selectedTicket.doctor_note && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  <FileText className="size-3.5" />
                  Doctor&apos;s Note
                </div>
                <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap border border-sky-500/20 bg-sky-500/5 rounded-2xl text-foreground/90">
                  {selectedTicket.doctor_note}
                </div>
              </div>
            )}

            {/* Registered date */}
            <div className="flex items-center justify-between px-3 py-2 border rounded-xl bg-muted/20 border-border/30">
              <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Registered
              </span>
              <span className="text-xs font-medium text-foreground">
                {selectedTicket.created_at
                  ? formatDate(selectedTicket.created_at)
                  : "—"}
              </span>
            </div>
          </>
        )}
      </ViewModal>
    </ViewLayout>
  );
}
