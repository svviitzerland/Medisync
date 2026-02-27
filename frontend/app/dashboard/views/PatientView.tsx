"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  CreditCard,
  RefreshCw,
  Clock,
  Stethoscope,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Send,
  Bot,
  User as UserIcon,
  ClipboardList,
  Loader2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/config";
import {
  patientChat,
  generatePreAssessmentQuestions,
  submitPreAssessment,
  ApiError,
  type QAHistoryItem,
  type SubmitPreAssessmentResponse,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import type { ChatMessage, Invoice as InvoiceType } from "@/types";

interface VisitTicket {
  id: string;
  fo_note: string;
  status: string;
  created_at: string;
  doctor_note: string | null;
  doctor_id: string | null;
  // Joined from doctors → profiles via doctor_id FK
  doctors: { profiles: { name: string } | null } | null;
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

  // Pre-assessment state
  const [paComplaint, setPaComplaint] = React.useState("");
  const [paQuestions, setPaQuestions] = React.useState<string[]>([]);
  const [paAnswers, setPaAnswers] = React.useState<string[]>([]);
  const [paStep, setPaStep] = React.useState<
    "complaint" | "questions" | "done"
  >("complaint");
  const [paLoading, setPaLoading] = React.useState(false);
  const [paError, setPaError] = React.useState<string | null>(null);
  const [paResult, setPaResult] =
    React.useState<SubmitPreAssessmentResponse | null>(null);

  // AI Chat state
  const [selectedChatTicket, setSelectedChatTicket] =
    React.useState<VisitTicket | null>(null);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatSending, setChatSending] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!activeTab || activeTab === "visits" || activeTab === "chat")
      fetchVisits();
    else if (activeTab === "billing") fetchInvoices();
    // pre-assessment tab needs no initial fetch
  }, [activeTab, userId]);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function fetchVisits() {
    setLoading(true);
    const { data } = await supabase
      .from("tickets")
      .select(
        "id, fo_note, status, created_at, doctor_note, doctor_id, doctors!doctor_id(profiles(name))",
      )
      .eq("patient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setVisits((data as unknown as VisitTicket[]) ?? []);
    setLoading(false);
  }

  async function fetchInvoices() {
    setLoading(true);
    // tickets!inner enforces a server-side INNER JOIN — only invoices with a
    // matching ticket row are returned (ticket_id is NOT NULL + ON DELETE CASCADE).
    // RLS on invoices already scopes results to the patient's own records.
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

  async function handleSendMessage() {
    if (!chatInput.trim() || !selectedChatTicket || chatSending) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: chatInput.trim(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatSending(true);
    try {
      const data = await patientChat(
        String(selectedChatTicket.id),
        userMsg.content,
      );
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content:
          data.reply ??
          data.message ??
          "Sorry, I couldn't get a response. Please try again.",
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content:
            err instanceof ApiError
              ? err.message
              : "Could not reach the AI service. Please try again later.",
        },
      ]);
    } finally {
      setChatSending(false);
    }
  }

  async function handleGenerateQuestions() {
    if (!paComplaint.trim() || paLoading) return;
    setPaLoading(true);
    setPaError(null);
    try {
      const data = await generatePreAssessmentQuestions(paComplaint.trim());
      if (data.status === "error" || !data.questions?.length) {
        setPaError("Could not generate follow-up questions. Please try again.");
      } else {
        setPaQuestions(data.questions);
        setPaAnswers(new Array(data.questions.length).fill(""));
        setPaStep("questions");
      }
    } catch (err) {
      setPaError(
        err instanceof ApiError
          ? err.message
          : "Failed to reach the AI service. Please try again.",
      );
    } finally {
      setPaLoading(false);
    }
  }

  async function handleSubmitAssessment() {
    if (paLoading) return;
    const unanswered = paAnswers.some((a) => !a.trim());
    if (unanswered) {
      setPaError("Please answer all questions before submitting.");
      return;
    }
    setPaLoading(true);
    setPaError(null);
    try {
      const qaHistory: QAHistoryItem[] = [
        { role: "user", content: paComplaint },
        ...paQuestions.flatMap((q, i) => [
          { role: "assistant" as const, content: q },
          { role: "user" as const, content: paAnswers[i] },
        ]),
      ];
      const result = await submitPreAssessment(qaHistory);
      setPaResult(result);
      setPaStep("done");
    } catch (err) {
      setPaError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit assessment. Please try again.",
      );
    } finally {
      setPaLoading(false);
    }
  }

  function handleResetAssessment() {
    setPaComplaint("");
    setPaQuestions([]);
    setPaAnswers([]);
    setPaStep("complaint");
    setPaError(null);
    setPaResult(null);
  }

  // ---- PRE-ASSESSMENT TAB ----
  if (activeTab === "pre-assessment") {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Pre-Assessment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Describe your symptoms and answer a few AI-generated questions to
            help our team prepare for your visit.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(["complaint", "questions", "done"] as const).map((step, i) => (
            <React.Fragment key={step}>
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium",
                  paStep === step
                    ? "text-primary"
                    : i < ["complaint", "questions", "done"].indexOf(paStep)
                      ? "text-emerald-400"
                      : "text-muted-foreground/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                    paStep === step
                      ? "bg-primary text-primary-foreground"
                      : i < ["complaint", "questions", "done"].indexOf(paStep)
                        ? "bg-emerald-400/20 text-emerald-400"
                        : "bg-muted text-muted-foreground/40",
                  )}
                >
                  {i + 1}
                </span>
                {step === "complaint"
                  ? "Complaint"
                  : step === "questions"
                    ? "Follow-up"
                    : "Submitted"}
              </div>
              {i < 2 && (
                <ChevronRight className="size-3 text-muted-foreground/30" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error banner */}
        {paError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{paError}</span>
          </div>
        )}

        {/* ─── Step 1: Complaint ─── */}
        {paStep === "complaint" && (
          <div className="space-y-4">
            <div className="p-5 space-y-3 border rounded-xl border-border/50 bg-card">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-primary" />
                <p className="text-sm font-medium">Initial Complaint</p>
              </div>
              <textarea
                className="w-full resize-none rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-28"
                placeholder="Describe your symptoms, pain, or health concern in detail…"
                value={paComplaint}
                onChange={(e) => setPaComplaint(e.target.value)}
                disabled={paLoading}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Be as specific as possible — include duration, severity, and any
                related symptoms.
              </p>
            </div>

            <Button
              className="w-full gap-2"
              disabled={!paComplaint.trim() || paLoading}
              onClick={handleGenerateQuestions}
            >
              {paLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating questions…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate Follow-up Questions
                </>
              )}
            </Button>
          </div>
        )}

        {/* ─── Step 2: Questions ─── */}
        {paStep === "questions" && (
          <div className="space-y-4">
            <div className="px-4 py-3 border rounded-xl border-border/40 bg-card/60">
              <p className="text-xs text-muted-foreground mb-0.5">
                Your complaint
              </p>
              <p className="text-sm">{paComplaint}</p>
            </div>

            <p className="text-sm font-medium">
              Please answer the following questions:
            </p>

            <div className="space-y-4">
              {paQuestions.map((q, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/50 bg-card p-4 space-y-2.5"
                >
                  <div className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium leading-snug">{q}</p>
                  </div>
                  <textarea
                    className="w-full px-3 py-2 text-sm border rounded-lg resize-none border-border/50 bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-16"
                    placeholder="Your answer…"
                    value={paAnswers[i]}
                    onChange={(e) => {
                      const next = [...paAnswers];
                      next[i] = e.target.value;
                      setPaAnswers(next);
                    }}
                    disabled={paLoading}
                    rows={2}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleResetAssessment}
                disabled={paLoading}
              >
                Start Over
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={paLoading || paAnswers.some((a) => !a.trim())}
                onClick={handleSubmitAssessment}
              >
                {paLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Pre-Assessment"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Done ─── */}
        {paStep === "done" && (
          <div className="space-y-4">
            {paResult?.status === "error" ? (
              <div className="flex flex-col items-center gap-4 p-8 text-center border rounded-xl border-rose-500/30 bg-rose-500/5">
                <XCircle className="size-10 text-rose-400" />
                <div>
                  <p className="font-semibold text-rose-400">
                    Submission Failed
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {paResult.detail ??
                      "Something went wrong. Please try again."}
                  </p>
                </div>
                <Button variant="outline" onClick={handleResetAssessment}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-8 text-center border rounded-xl border-emerald-500/30 bg-emerald-500/5">
                <CheckCircle2 className="size-10 text-emerald-400" />
                <div>
                  <p className="font-semibold">Pre-Assessment Submitted!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Our team has received your assessment and will be in touch
                    shortly.
                  </p>
                  {paResult?.ticket_id && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Reference ID:{" "}
                      <span className="font-mono text-foreground">
                        {paResult.ticket_id}
                      </span>
                    </p>
                  )}
                  {paResult?.assessment_id && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Assessment ID:{" "}
                      <span className="font-mono text-foreground">
                        {paResult.assessment_id}
                      </span>
                    </p>
                  )}
                </div>
                <Button variant="outline" onClick={handleResetAssessment}>
                  Submit Another
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---- BILLING TAB ----
  if (activeTab === "billing") {
    const totalPaid = invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + (i.total_amount ?? 0), 0);

    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Billing History</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your invoice and payment records
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

        {!loading && invoices.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 p-4 border rounded-xl border-border/50 bg-card">
              <div className="flex items-center justify-center rounded-lg size-9 bg-emerald-400/10">
                <CheckCircle2 className="size-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-sm font-bold">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-xl border-border/50 bg-card">
              <div className="flex items-center justify-center rounded-lg size-9 bg-sky-400/10">
                <CreditCard className="size-4 text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invoices</p>
                <p className="text-xl font-bold">{invoices.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-xl border-border/50 bg-card">
              <div className="flex items-center justify-center rounded-lg size-9 bg-rose-400/10">
                <XCircle className="size-4 text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unpaid</p>
                <p className="text-xl font-bold">
                  {invoices.filter((i) => i.status === "unpaid").length}
                </p>
              </div>
            </div>
          </div>
        )}

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

  // ---- AI CHAT TAB ----
  if (activeTab === "chat") {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Ask AI About Your Visit</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask the AI assistant about your diagnosis, treatment, or medication
            based on your doctor&apos;s notes.
          </p>
        </div>

        {!selectedChatTicket ? (
          // Ticket selector
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Select a visit to chat about:
            </p>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 border animate-pulse rounded-xl border-border/30 bg-card"
                  />
                ))}
              </div>
            ) : visits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 border rounded-xl border-border/50 text-muted-foreground">
                <MessageCircle className="size-10 opacity-30" />
                <p className="text-sm">No visits available to chat about</p>
              </div>
            ) : (
              visits.map((ticket) => (
                <button
                  key={ticket.id}
                  className="w-full text-left rounded-xl border border-border/40 bg-card p-4 hover:bg-muted/20 transition-colors space-y-1.5"
                  onClick={() => {
                    setSelectedChatTicket(ticket);
                    setChatMessages([]);
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        STATUS_COLORS[ticket.status] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {ticket.status?.replace(/_/g, " ")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {formatDate(ticket.created_at)}
                    </span>
                    {ticket.doctors?.profiles?.name && (
                      <span className="text-xs text-muted-foreground">
                        Dr. {ticket.doctors.profiles.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ticket.fo_note}
                  </p>
                  {ticket.doctor_note && (
                    <p className="text-xs text-primary">
                      Doctor&apos;s note available — AI can answer questions
                      about this visit
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          // Chat interface
          <div
            className="flex flex-col overflow-hidden border rounded-xl border-border/50 bg-card"
            style={{ height: "calc(100vh - 280px)", minHeight: "440px" }}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40">
              <div className="flex items-center min-w-0 gap-3">
                <div className="flex items-center justify-center rounded-full size-8 shrink-0 bg-primary/10">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">MediSync AI</p>
                  <p className="text-xs truncate text-muted-foreground">
                    {formatDate(selectedChatTicket.created_at)} ·{" "}
                    {selectedChatTicket.status?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground"
                onClick={() => {
                  setSelectedChatTicket(null);
                  setChatMessages([]);
                }}
              >
                Change Visit
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <Bot className="size-10 opacity-30" />
                  <p className="max-w-xs text-sm text-center">
                    {selectedChatTicket.doctor_note
                      ? "Hi! I have access to your doctor\u2019s notes for this visit. Ask me anything about your diagnosis or treatment."
                      : "No doctor\u2019s notes available yet for this visit. Please wait for your examination to be completed."}
                  </p>
                </div>
              )}

              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      msg.role === "user" ? "bg-primary/15" : "bg-muted",
                    )}
                  >
                    {msg.role === "user" ? (
                      <UserIcon className="size-4 text-primary" />
                    ) : (
                      <Bot className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm",
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {chatSending && (
                <div className="flex gap-3">
                  <div className="flex items-center justify-center rounded-full size-8 shrink-0 bg-muted">
                    <Bot className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-1 px-4 py-3 rounded-tl-sm rounded-2xl bg-muted">
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/40">
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <textarea
                  className="flex-1 px-3 py-2 text-sm border resize-none rounded-xl border-border/50 bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-10 max-h-32"
                  placeholder="Ask about your diagnosis, medication, or treatment…"
                  rows={1}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={chatSending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!chatInput.trim() || chatSending}
                  className="w-10 h-10 shrink-0"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- VISIT HISTORY (default) ----
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Medical Status</h2>
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
                      visit.doctors?.profiles?.name
                        ? "bg-sky-400/10"
                        : "bg-muted",
                    )}
                  >
                    <UserRound
                      className={cn(
                        "size-3.5",
                        visit.doctors?.profiles?.name
                          ? "text-sky-400"
                          : "text-muted-foreground/40",
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] leading-none text-muted-foreground mb-0.5">
                      Assigned Doctor
                    </p>
                    {visit.doctors?.profiles?.name ? (
                      <p className="text-sm font-medium">
                        Dr. {visit.doctors.profiles.name}
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
