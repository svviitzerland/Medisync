"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Stethoscope,
  Clock,
  RefreshCw,
  ChevronRight,
  X,
  Brain,
  Send,
  History,
  User,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/config";
import { doctorAssist, completeCheckup, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Ticket, PatientProfile } from "@/types";

interface HistoryTicket {
  id: string;
  fo_note: string;
  doctor_note: string | null;
  status: string;
  created_at: string;
  doctors: {
    specialization: string;
    profiles: { name: string } | null;
  } | null;
}

export default function DoctorView({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Examination modal
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(
    null,
  );
  const [doctorNote, setDoctorNote] = React.useState("");
  const [requirePharmacy, setRequirePharmacy] = React.useState(false);
  const [requiresInpatient, setRequiresInpatient] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  // History modal
  const [historyPatient, setHistoryPatient] =
    React.useState<PatientProfile | null>(null);
  const [history, setHistory] = React.useState<HistoryTicket[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  // AI Assist
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiSuggestion, setAiSuggestion] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!activeTab || activeTab === "patients") fetchMyTickets();
  }, [activeTab, userId]);

  async function fetchMyTickets() {
    setLoading(true);
    const { data } = await supabase
      .from("tickets")
      .select(
        "id, fo_note, doctor_note, status, created_at, nurse_team_id, profiles!patient_id(id, name, nik, age)",
      )
      .eq("doctor_id", userId)
      .neq("status", "completed")
      .order("created_at", { ascending: true });
    setTickets((data as unknown as Ticket[]) ?? []);
    setLoading(false);
  }

  async function handleViewHistory(patient: PatientProfile) {
    setHistoryPatient(patient);
    setLoadingHistory(true);
    const { data } = await supabase
      .from("tickets")
      .select(
        "id, fo_note, doctor_note, status, created_at, doctors(specialization, profiles(name))",
      )
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory((data as unknown as HistoryTicket[]) ?? []);
    setLoadingHistory(false);
  }

  async function handleAIAssist() {
    if (!selectedTicket?.profiles?.nik) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const data = await doctorAssist(
        selectedTicket.profiles.nik,
        doctorNote || undefined,
      );
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
        if (!doctorNote) setDoctorNote(data.suggestion);
      }
    } catch {
      // AI assist is optional, silently fail
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmitExamination() {
    if (!selectedTicket || !doctorNote.trim()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      await completeCheckup(selectedTicket.id, {
        doctor_note: doctorNote,
        require_pharmacy: requirePharmacy,
        requires_inpatient: requiresInpatient,
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSelectedTicket(null);
        setDoctorNote("");
        setRequirePharmacy(false);
        setRequiresInpatient(false);
        setSubmitSuccess(false);
        fetchMyTickets();
      }, 1500);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the server. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ---- SCHEDULE TAB ----
  if (activeTab === "schedule") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">My Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your upcoming appointments and shifts
          </p>
        </div>
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-border/50 text-muted-foreground">
          <Calendar className="size-10 opacity-30" />
          <p className="text-sm">Schedule view coming soon</p>
        </div>
      </div>
    );
  }

  // ---- PATIENT QUEUE (default) ----
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Patient Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your assigned patients awaiting examination
          </p>
        </div>
        <button
          onClick={fetchMyTickets}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border/30 bg-card"
            />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-border/50 text-muted-foreground">
          <Stethoscope className="size-10 opacity-30" />
          <p className="text-sm">No patients in your queue</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-xl border border-border/40 bg-card p-4 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold">
                      {ticket.profiles?.name ?? "Unknown"}
                    </p>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        STATUS_COLORS[ticket.status] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {ticket.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    NIK: {ticket.profiles?.nik} · Age: {ticket.profiles?.age}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                    {ticket.fo_note}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatDate(ticket.created_at)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {ticket.profiles && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewHistory(ticket.profiles!)}
                      className="gap-1.5"
                    >
                      <History className="size-3.5" />
                      History
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setDoctorNote(ticket.doctor_note ?? "");
                      setRequiresInpatient(!!ticket.nurse_team_id);
                      setSubmitError(null);
                      setSubmitSuccess(false);
                    }}
                    className="gap-1.5"
                  >
                    <ChevronRight className="size-3.5" />
                    Examine
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Examination Modal */}
      {selectedTicket && (
        <Modal
          title={`Examine: ${selectedTicket.profiles?.name ?? "Patient"}`}
          onClose={() => setSelectedTicket(null)}
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3 text-sm">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider mb-1">
                FO Notes
              </p>
              <p>{selectedTicket.fo_note}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Diagnosis & Treatment Notes</Label>
                <button
                  onClick={handleAIAssist}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {aiLoading ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Brain className="size-3" />
                  )}
                  AI Assist
                </button>
              </div>
              <textarea
                value={doctorNote}
                onChange={(e) => setDoctorNote(e.target.value)}
                placeholder="Enter diagnosis, treatment plan, and notes…"
                rows={5}
                className={cn(
                  "w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                  "resize-none transition-colors",
                )}
              />
            </div>

            {aiSuggestion && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
                <span className="font-medium text-primary">
                  AI Suggestion:{" "}
                </span>
                {aiSuggestion}
              </div>
            )}

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePharmacy}
                  onChange={(e) => setRequirePharmacy(e.target.checked)}
                  className="rounded border-border"
                />
                Needs pharmacy
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresInpatient}
                  onChange={(e) => setRequiresInpatient(e.target.checked)}
                  className="rounded border-border"
                />
                Requires inpatient
              </label>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                Examination completed successfully!
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                onClick={handleSubmitExamination}
                disabled={submitting || !doctorNote.trim() || submitSuccess}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Complete Examination
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Patient History Modal */}
      {historyPatient && (
        <Modal
          title={`Medical History: ${historyPatient.name}`}
          onClose={() => {
            setHistoryPatient(null);
            setHistory([]);
          }}
        >
          {loadingHistory ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No visit history found
            </p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="rounded-lg border border-border/40 bg-muted/10 p-4 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        STATUS_COLORS[h.status] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {h.status?.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(h.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Complaint:</span>{" "}
                    {h.fo_note}
                  </p>
                  {h.doctor_note && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Diagnosis:</span>{" "}
                      {h.doctor_note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border/50 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
