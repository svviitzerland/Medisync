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
  ChevronDown,
  ChevronUp,
  User,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS, SEVERITY_COLORS } from "@/lib/config";
import {
  analyzeTicket,
  registerPatient,
  createTicket,
  ApiError,
} from "@/lib/api";
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
  status: string;
  created_at: string;
  profiles: { name: string; nik: string } | null;
}

export default function FOView({ userId: _userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");
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

  // Ticket creation
  const [creating, setCreating] = React.useState(false);
  const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Ticket list
  const [tickets, setTickets] = React.useState<TicketRecord[]>([]);
  const [loadingTickets, setLoadingTickets] = React.useState(false);

  // Modal for recent tickets
  const [selectedTicket, setSelectedTicket] = React.useState<TicketRecord | null>(null);

  React.useEffect(() => {
    fetchTickets();
  }, []);

  async function handleSearchNIK() {
    if (!nikSearch.trim()) return;
    setSearching(true);
    setPatientInfo(null);
    setAnalysis(null);
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
        const regData = await registerPatient({
          nik: nikSearch,
          name: newName,
          age: parseInt(newAge),
          phone: newPhone,
        });
        if (regData.patient?.id) {
          finalPatientId = regData.patient.id;
        } else {
          setCreateError(regData.detail ?? "Patient registration failed");
          setCreating(false);
          return;
        }
      } catch (err) {
        setCreateError(
          err instanceof ApiError
            ? err.message
            : "Could not register new patient. Please try again.",
        );
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
          requires_inpatient: analysis.requires_inpatient,
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
      .select("id, fo_note, status, created_at, profiles!patient_id(name, nik)")
      .order("created_at", { ascending: false })
      .limit(10);
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
            <div className="space-y-3 pt-2">
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
                <div className="p-4 space-y-3 border rounded-xl border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Brain className="size-4 text-primary" />
                    <span className="text-sm font-semibold">
                      AI Triage Result
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Severity</span>
                      <div className="mt-1">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                            SEVERITY_COLORS[analysis.severity_level] ??
                            "bg-muted text-muted-foreground border-border",
                          )}
                        >
                          {analysis.severity_level}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Inpatient</span>
                      <p className="mt-1 font-medium">
                        {analysis.requires_inpatient ? (
                          <span className="text-rose-400">
                            Yes — Ward admission
                          </span>
                        ) : (
                          <span className="text-emerald-400">
                            No — Outpatient
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      AI Reasoning
                    </span>
                    <p className="mt-1 text-sm leading-relaxed">
                      {analysis.reasoning}
                    </p>
                  </div>
                </div>
              )}
            </ViewSection>
          )}

          {/* Step 3: Create Ticket */}
          {patientInfo && foNote.trim() && analysis && (
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
                className="w-full gap-2 shadow-sm font-bold tracking-wide"
              >
                {creating ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Ticket className="size-5 mr-1" />
                )}
                {creating ? "Creating..." : "Create Examination Ticket"}
              </Button>
            </ViewSection>
          )}
        </ViewContentCard>
      </ViewMain>

      {/* Right Column: Recent Tickets Sidebar */}
      <ViewSidebar>
        <div className="flex items-center justify-between bg-card/60 backdrop-blur-md rounded-2xl border border-border/40 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Ticket className="size-5 text-primary" />
            </div>
            <h3 className="text-base font-bold">Recent Tickets</h3>
          </div>
          <button
            onClick={fetchTickets}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <RefreshCw className={cn("size-3.5", loadingTickets && "animate-spin")} />
            Refresh
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {loadingTickets ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[104px] border animate-pulse rounded-2xl border-border/30 bg-card/40"
                />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-sm border border-dashed rounded-2xl border-border/40 bg-card/10 text-muted-foreground">
              <Ticket className="size-8 mb-3 opacity-20" />
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
                    <p className="font-semibold text-foreground truncate pr-2">
                      {ticket.profiles?.name ?? "Unknown Patient"}
                    </p>
                  </div>
                  <div className="mt-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.fo_note}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
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
        title="Ticket Info"
        description="Details and current status"
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        icon={<Ticket className="size-6" />}
      >
        {selectedTicket && (
          <>
            <div className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/30 border border-border/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patient Details</p>
              <p className="font-semibold text-lg text-foreground">{selectedTicket?.profiles?.name ?? "Unknown Patient"}</p>
              <p className="text-sm text-muted-foreground font-medium">NIK: {selectedTicket?.profiles?.nik ?? "No NIK"}</p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Complaint / Notes</p>
              <div className="bg-background border border-border/50 p-4 rounded-2xl text-sm leading-relaxed text-foreground/90 shadow-inner">
                {selectedTicket?.fo_note}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-muted/20 border border-border/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                <div>
                  <span className={cn("inline-flex rounded-lg px-3 py-1 text-xs font-bold uppercase shadow-sm", selectedTicket?.status && STATUS_COLORS[selectedTicket.status] ? STATUS_COLORS[selectedTicket.status] : "bg-muted")}>
                    {selectedTicket?.status?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-muted/20 border border-border/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered</p>
                <p className="text-sm font-medium">{selectedTicket?.created_at ? formatDate(selectedTicket.created_at) : ""}</p>
              </div>
            </div>
          </>
        )}
      </ViewModal>
    </ViewLayout >
  );
}
