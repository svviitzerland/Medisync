"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  CreditCard,
  RefreshCw,
  Clock,
  Stethoscope,
  Send,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  UserRound,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/config";
import {
  generatePreAssessmentQuestions,
  submitPreAssessment,
  ApiError,
  type QAHistoryItem,
  type SubmitPreAssessmentResponse,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import type { Invoice as InvoiceType } from "@/types";

interface VisitTicket {
  id: string;
  fo_note: string;
  status: string;
  created_at: string;
  doctor_note: string | null;
  doctor_id: string | null;
  doctor_profiles: { name: string } | null;
}

type PatientInvoice = Omit<InvoiceType, "tickets"> & {
  tickets: { id: string; fo_note: string; patient_id?: string } | null;
};

export default function PatientView({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  const [visits, setVisits] = React.useState<VisitTicket[]>([]);
  const [invoices, setInvoices] = React.useState<PatientInvoice[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Health Check state
  const [complaint, setComplaint] = React.useState("");
  const [hcLoading, setHcLoading] = React.useState(false);
  const [hcError, setHcError] = React.useState<string | null>(null);
  const [hcPhase, setHcPhase] = React.useState<
    "initial" | "questions" | "submitting" | "result"
  >("initial");
  const [questions, setQuestions] = React.useState<string[]>([]);
  const [answers, setAnswers] = React.useState<string[]>([]);
  const [currentQ, setCurrentQ] = React.useState(0);
  const [result, setResult] =
    React.useState<SubmitPreAssessmentResponse | null>(null);
  const answerRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!activeTab || activeTab === "visits") fetchVisits();
    else if (activeTab === "billing") fetchInvoices();
  }, [activeTab, userId]);

  React.useEffect(() => {
    if (hcPhase === "questions") {
      answerRef.current?.focus();
    }
  }, [currentQ, hcPhase]);

  async function fetchVisits() {
    setLoading(true);
    const { data } = await supabase
      .from("tickets")
      .select(
        "id, fo_note, status, created_at, doctor_note, doctor_id, doctor_profiles:profiles!doctor_id(name)",
      )
      .eq("patient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setVisits((data as unknown as VisitTicket[]) ?? []);
    setLoading(false);
  }

  async function fetchInvoices() {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select(
        "id, doctor_fee, medicine_fee, room_fee, total_amount, status, issued_at, tickets!inner(id, fo_note)",
      )
      .order("issued_at", { ascending: false });
    setInvoices((data as unknown as PatientInvoice[]) ?? []);
    setLoading(false);
  }

  function formatDate(d: string) {
    return formatDateTime(d);
  }

  // Health Check handlers
  async function handleComplaintSubmit() {
    if (!complaint.trim() || hcLoading) return;
    setHcLoading(true);
    setHcError(null);
    try {
      const data = await generatePreAssessmentQuestions(complaint.trim());
      if (data.status === "error" || !data.questions?.length) {
        setHcError(
          "We couldn't process your complaint. Please provide more detail.",
        );
      } else {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(""));
        setCurrentQ(0);
        setHcPhase("questions");
      }
    } catch (err) {
      setHcError(
        err instanceof ApiError
          ? err.message
          : "Failed to reach AI service. Please try again.",
      );
    } finally {
      setHcLoading(false);
    }
  }

  async function handleAnswerNext() {
    if (!answers[currentQ]?.trim()) return;

    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      // All answered — submit
      setHcPhase("submitting");
      setHcError(null);
      try {
        const qaHistory: QAHistoryItem[] = [
          { role: "user", content: complaint },
          ...questions.flatMap((q, i) => [
            { role: "assistant" as const, content: q },
            { role: "user" as const, content: answers[i] },
          ]),
        ];
        const res = await submitPreAssessment(qaHistory);
        setResult(res);
        setHcPhase("result");
      } catch (err) {
        setHcError(
          err instanceof ApiError
            ? err.message
            : "Submission failed. Please try again.",
        );
        setHcPhase("questions");
      }
    }
  }

  function handleReset() {
    setComplaint("");
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setHcPhase("initial");
    setHcError(null);
    setResult(null);
  }

  // ──────────────────────── HEALTH CHECK (Typeform-style) ────────────────────
  if (activeTab === "pre-assessment") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] max-w-xl mx-auto px-4">
        {/* Step 1: Initial complaint */}
        {hcPhase === "initial" && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 text-primary mb-4">
                <Sparkles className="size-5" />
                <span className="text-xs font-medium uppercase tracking-widest">
                  AI Health Check
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                What do you feel today?
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Describe your symptoms or health concerns. Our AI will ask a few
                follow-up questions to better understand your condition.
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleComplaintSubmit();
                  }
                }}
                placeholder="e.g. I've had a persistent headache for the past 3 days..."
                rows={4}
                disabled={hcLoading}
                className="w-full resize-none rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                autoFocus
              />

              {hcError && (
                <p className="text-sm text-destructive text-center">
                  {hcError}
                </p>
              )}

              <Button
                onClick={handleComplaintSubmit}
                disabled={hcLoading || !complaint.trim()}
                className="w-full gap-2 h-11 rounded-xl"
                size="lg"
              >
                {hcLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Follow-up questions (one at a time) */}
        {hcPhase === "questions" && (
          <div
            key={currentQ}
            className="w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-400"
          >
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Question {currentQ + 1} of {questions.length}
                </span>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <RotateCcw className="size-3" />
                  Start over
                </button>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{
                    width: `${((currentQ + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold leading-relaxed">
                {questions[currentQ]}
              </h3>

              <textarea
                ref={answerRef}
                value={answers[currentQ] ?? ""}
                onChange={(e) => {
                  const updated = [...answers];
                  updated[currentQ] = e.target.value;
                  setAnswers(updated);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAnswerNext();
                  }
                }}
                placeholder="Type your answer..."
                rows={3}
                className="w-full resize-none rounded-xl border border-border/60 bg-card px-4 py-3.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />

              {hcError && (
                <p className="text-sm text-destructive">{hcError}</p>
              )}

              <Button
                onClick={handleAnswerNext}
                disabled={!answers[currentQ]?.trim()}
                className="w-full gap-2 h-11 rounded-xl"
                size="lg"
              >
                {currentQ < questions.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="size-4" />
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Submit Assessment
                  </>
                )}
              </Button>
            </div>

            {/* Answered summary (collapsed) */}
            {currentQ > 0 && (
              <div className="space-y-2 pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground font-medium">
                  Previous answers
                </p>
                {questions.slice(0, currentQ).map((q, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-muted/30 border border-border/20 p-3 space-y-1"
                  >
                    <p className="text-xs text-muted-foreground">{q}</p>
                    <p className="text-sm">{answers[i]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2.5: Submitting */}
        {hcPhase === "submitting" && (
          <div className="w-full flex flex-col items-center gap-4 py-12 animate-in fade-in duration-300">
            <Loader2 className="size-8 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <p className="font-medium">Analyzing your responses</p>
              <p className="text-sm text-muted-foreground">
                This may take a moment...
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {hcPhase === "result" && result && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Assessment Complete</h2>
                <p className="text-sm text-muted-foreground">
                  Here is your AI-generated health summary
                </p>
              </div>
            </div>

            {/* Summary card */}
            <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Summary
                </p>
                <p className="text-sm leading-relaxed">
                  {result.ai_summary || "No summary available."}
                </p>
              </div>

              {result.suggested_doctor_id && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2.5 text-sm">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>
                    A doctor has been recommended for your case. Please visit the
                    hospital for further examination.
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This is an AI-generated preliminary assessment and should not
              replace professional medical advice.
            </p>

            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full gap-2 h-11 rounded-xl"
              size="lg"
            >
              <RotateCcw className="size-4" />
              Start New Check
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────── BILLING HISTORY ────────────────────────
  if (activeTab === "billing") {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Billing History</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your payment and invoice records
            </p>
          </div>
          <button
            onClick={fetchInvoices}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border h-28 animate-pulse rounded-xl border-border/30 bg-card"
              />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 border rounded-xl border-border/50 text-muted-foreground">
            <CreditCard className="size-10 opacity-30" />
            <p className="text-sm">No billing records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => {
              const total = inv.total_amount ?? 0;
              return (
                <div
                  key={inv.id}
                  className="p-4 space-y-3 border rounded-xl border-border/40 bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {inv.tickets?.fo_note ?? "Visit"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {inv.issued_at ? formatDate(inv.issued_at) : "—"}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        inv.status === "paid"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400",
                      )}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3 text-sm border rounded-lg border-border/30 bg-muted/20">
                    <div>
                      <p className="text-xs text-muted-foreground">Doctor</p>
                      <p className="font-medium">
                        {formatCurrency(inv.doctor_fee ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Medicine</p>
                      <p className="font-medium">
                        {formatCurrency(inv.medicine_fee ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Room</p>
                      <p className="font-medium">
                        {formatCurrency(inv.room_fee ?? 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-base font-bold">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────── MEDICAL HISTORY (default) ────────────────────────
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Medical History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your visit history and medical records
          </p>
        </div>
        <button
          onClick={fetchVisits}
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
              className="h-32 border animate-pulse rounded-xl border-border/30 bg-card"
            />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 border rounded-xl border-border/50 text-muted-foreground">
          <Activity className="size-10 opacity-30" />
          <p className="text-sm">No visit history found</p>
        </div>
      ) : (
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute w-px translate-x-px left-5 top-6 bottom-6 bg-border/40" />

          {visits.map((visit, i) => (
            <div key={visit.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div
                className={cn(
                  "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full ring-2 ring-background",
                  STATUS_COLORS[visit.status]?.includes("emerald")
                    ? "bg-emerald-500/20"
                    : i === 0
                      ? "bg-primary/20"
                      : "bg-muted",
                )}
              >
                <Stethoscope
                  className={cn(
                    "size-4",
                    i === 0 ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1 p-4 mb-3 space-y-3 border rounded-xl border-border/40 bg-card">
                {/* Ticket ID + status + timestamp row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground/60 border border-border/40 rounded px-1.5 py-0.5">
                    #{String(visit.id).slice(0, 8)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                      STATUS_COLORS[visit.status] ??
                      "bg-muted text-muted-foreground",
                    )}
                  >
                    {visit.status?.replace(/_/g, " ")}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatDate(visit.created_at)}
                  </span>
                </div>

                {/* Assigned doctor */}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full",
                      visit.doctor_profiles?.name
                        ? "bg-sky-400/10"
                        : "bg-muted",
                    )}
                  >
                    <UserRound
                      className={cn(
                        "size-3.5",
                        visit.doctor_profiles?.name
                          ? "text-sky-400"
                          : "text-muted-foreground/40",
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] leading-none text-muted-foreground mb-0.5">
                      Doctor
                    </p>
                    {visit.doctor_profiles?.name ? (
                      <p className="text-sm font-medium">
                        {visit.doctor_profiles.name}
                      </p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground/60">
                        Not assigned yet
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm">
                  <span className="text-muted-foreground">Complaint: </span>
                  {visit.fo_note}
                </p>

                {visit.doctor_note && (
                  <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2.5 text-sm">
                    <p className="mb-1 text-xs font-medium text-primary">
                      Doctor&apos;s Diagnosis
                    </p>
                    <p>{visit.doctor_note}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
