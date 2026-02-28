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
  MessageCircle,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/config";
import {
  generatePreAssessmentQuestions,
  submitPreAssessment,
  patientChat,
  ApiError,
  type QAHistoryItem,
  type SubmitPreAssessmentResponse,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  ViewLayout,
  ViewMain,
  ViewHeader,
  ViewContentCard,
  ViewModal,
} from "@/components/dashboard/view-layout";
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

  // Detail Modal States
  const [selectedVisit, setSelectedVisit] = React.useState<VisitTicket | null>(
    null,
  );
  const [visitPrescriptions, setVisitPrescriptions] = React.useState<
    VisitPrescription[]
  >([]);
  const [visitQA, setVisitQA] = React.useState<QAHistoryItem[]>([]);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  // Chat state
  const [chatTickets, setChatTickets] = React.useState<VisitTicket[]>([]);
  const [chatTicketId, setChatTicketId] = React.useState<string | null>(null);
  const [chatMessages, setChatMessages] = React.useState<
    { role: "user" | "bot"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatError, setChatError] = React.useState<string | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeTab === "visits") fetchVisits();
    else if (activeTab === "billing") fetchInvoices();
    else if (activeTab === "chat") fetchChatTickets();
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

  async function fetchChatTickets() {
    const { data } = await supabase
      .from("tickets")
      .select(
        "id, fo_note, status, created_at, doctor_note, doctor_id, doctor_profiles:profiles!doctor_id(name)",
      )
      .eq("patient_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    const tickets = (data as unknown as VisitTicket[]) ?? [];
    setChatTickets(tickets);
    // Auto-select the most recent ticket with a doctor note
    const withNote = tickets.find((t) => t.doctor_note);
    if (withNote && !chatTicketId) {
      setChatTicketId(withNote.id);
    } else if (tickets.length > 0 && !chatTicketId) {
      setChatTicketId(tickets[0].id);
    }
  }

  async function handleSendChat() {
    if (!chatInput.trim() || !chatTicketId || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatError(null);
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const res = await patientChat(chatTicketId, msg);
      if (res.status === "error") {
        setChatError(res.message ?? "Chat error occurred.");
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "bot", content: res.reply ?? "No response from AI." },
        ]);
      }
    } catch (err) {
      setChatError(
        err instanceof ApiError ? err.message : "Failed to reach AI service.",
      );
    } finally {
      setChatLoading(false);
      setTimeout(
        () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }

  async function openVisitDetail(visit: VisitTicket) {
    setSelectedVisit(visit);
    setLoadingDetail(true);
    setVisitPrescriptions([]);
    setVisitQA([]);

    // Fetch prescriptions
    const { data: rxData } = await supabase
      .from("prescriptions")
      .select("id, quantity, notes, status, catalog_medicines(name, price)")
      .eq("ticket_id", visit.id);
    if (rxData) {
      setVisitPrescriptions(
        rxData.map((r: any) => ({
          name: r.catalog_medicines?.name ?? "Unknown",
          price: r.catalog_medicines?.price ?? 0,
          quantity: r.quantity,
          notes: r.notes,
          status: r.status,
        })),
      );
    }

    // Fetch pre-assessment Q&A
    const { data: qaData } = await supabase
      .from("ai_pre_assessments")
      .select("qa_history, ai_summary")
      .eq("ticket_id", visit.id)
      .limit(1);
    if (qaData?.[0]?.qa_history) {
      setVisitQA(qaData[0].qa_history);
    }

    setLoadingDetail(false);
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

  // ──────────────────────── CHAT WITH DOCTOR ────────────────────
  if (activeTab === "chat") {
    const selectedChatTicket = chatTickets.find((t) => t.id === chatTicketId);
    return (
      <ViewLayout>
        <ViewMain className="max-w-2xl">
          <ViewHeader
            title="Chat with Doctor AI"
            description="Ask questions about your diagnosis, treatment, or medication based on your recent visit."
          />

          {/* Ticket selector */}
          <ViewContentCard>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Visit to Ask About
              </p>
              {chatTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No visits found. Please complete a health check first.
                </p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {chatTickets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setChatTicketId(t.id);
                        setChatMessages([]);
                        setChatError(null);
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                        chatTicketId === t.id
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/40 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <span className="font-mono opacity-60">
                        #{t.id.slice(0, 6)}
                      </span>
                      <span className="line-clamp-1 max-w-36">{t.fo_note}</span>
                      {t.doctor_note && (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                          Diagnosed
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat messages */}
            <div className="mt-2 flex flex-col gap-3 min-h-64 max-h-96 overflow-y-auto rounded-xl border border-border/30 bg-muted/10 p-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-8">
                  <Bot className="size-10 opacity-20" />
                  <p className="text-sm text-center max-w-xs">
                    {chatTicketId
                      ? selectedChatTicket?.doctor_note
                        ? "Ask about your diagnosis, medication, or treatment plan."
                        : "Your doctor hasn't completed the examination yet. You may still ask general questions."
                      : "Select a visit above to start chatting."}
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm max-w-[85%] shadow-sm",
                      msg.role === "user"
                        ? "self-end bg-primary text-primary-foreground rounded-br-sm"
                        : "self-start bg-card border border-border/40 rounded-bl-sm",
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">
                      {msg.role === "user" ? "You" : "AI Assistant"}
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="self-start flex items-center gap-2 rounded-xl border border-border/40 bg-card px-4 py-3 text-sm shadow-sm">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">Thinking...</span>
                </div>
              )}
              {chatError && (
                <p className="self-start text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {chatError}
                </p>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="flex gap-2 mt-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder={
                  chatTicketId
                    ? "Ask about your diagnosis, medication, or how to take your medicine..."
                    : "Select a visit first..."
                }
                disabled={!chatTicketId || chatLoading}
                rows={2}
                className="flex-1 resize-none rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || !chatTicketId || chatLoading}
                className="flex size-12 shrink-0 self-end items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                {chatLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Send className="size-5" />
                )}
              </button>
            </div>
          </ViewContentCard>
        </ViewMain>
      </ViewLayout>
    );
  }

  // ──────────────────────── HEALTH CHECK (Typeform-style) ────────────────────
  if (!activeTab || activeTab === "pre-assessment") {
    return (
      <ViewLayout>
        <ViewMain className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] max-w-xl mx-auto px-4">
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
                  Describe your symptoms or health concerns. Our AI will ask a
                  few follow-up questions to better understand your condition.
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
                      A doctor has been recommended for your case. Please visit
                      the hospital for further examination.
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
        </ViewMain>
      </ViewLayout>
    );
  }

  // ──────────────────────── BILLING HISTORY ────────────────────────
  if (activeTab === "billing") {
    return (
      <ViewLayout>
        <ViewMain className="max-w-3xl">
          <ViewHeader
            title="Billing History"
            description="Your payment and invoice records"
          >
            <button
              onClick={fetchInvoices}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors shadow-sm"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Refresh
            </button>
          </ViewHeader>

          <ViewContentCard>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="border h-28 animate-pulse rounded-2xl border-border/30 bg-muted/20"
                  />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-4 border border-dashed rounded-2xl border-border/50 bg-muted/5 text-muted-foreground">
                <div className="flex items-center justify-center rounded-full size-16 bg-muted/50">
                  <CreditCard className="size-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">No billing records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((inv) => {
                  const total = inv.total_amount ?? 0;
                  return (
                    <div
                      key={inv.id}
                      className="p-5 space-y-4 border rounded-2xl border-border/40 bg-card hover:border-primary/20 transition-colors shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-bold text-foreground line-clamp-1 mb-0.5">
                            {inv.tickets?.fo_note ?? "Visit"}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Clock className="size-3.5" />
                            {inv.issued_at ? formatDate(inv.issued_at) : "—"}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "inline-flex shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-border/50",
                            inv.status === "paid"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-500",
                          )}
                        >
                          {inv.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 p-4 text-sm border rounded-xl border-border/30 bg-muted/20 shadow-inner">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Doctor
                          </p>
                          <p className="font-medium">
                            {formatCurrency(inv.doctor_fee ?? 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Medicine
                          </p>
                          <p className="font-medium">
                            {formatCurrency(inv.medicine_fee ?? 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Room
                          </p>
                          <p className="font-medium">
                            {formatCurrency(inv.room_fee ?? 0)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm pt-2 border-t border-border/30 mt-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Total Summary
                        </span>
                        <span className="text-lg font-black text-primary">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ViewContentCard>
        </ViewMain>
      </ViewLayout>
    );
  }

  if (activeTab === "visits") {
    return (
      <ViewLayout>
        <ViewMain className="max-w-3xl">
          <ViewHeader
            title="Medical History"
            description="Your visit history and medical records"
          >
            <button
              onClick={fetchVisits}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors shadow-sm"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Refresh
            </button>
          </ViewHeader>

          <ViewContentCard>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 border animate-pulse rounded-2xl border-border/30 bg-muted/20"
                  />
                ))}
              </div>
            ) : visits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-4 border border-dashed rounded-2xl border-border/50 bg-muted/5 text-muted-foreground">
                <div className="flex items-center justify-center rounded-full size-16 bg-muted/50">
                  <Activity className="size-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">No visit history found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visits.map((visit) => (
                  <button
                    key={visit.id}
                    onClick={() => openVisitDetail(visit)}
                    className="w-full text-left rounded-2xl border border-border/40 bg-card p-5 hover:bg-muted/10 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-primary/20 group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-[10px] font-bold bg-muted text-muted-foreground border border-border/50 rounded-md px-2 py-1 shadow-sm">
                        #{String(visit.id).slice(0, 8)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-border/50",
                          STATUS_COLORS[visit.status] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {visit.status?.replace(/_/g, " ")}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground ml-auto bg-muted/30 px-2 py-1 rounded-md border border-border/30">
                        <Clock className="size-3.5" />
                        {formatDate(visit.created_at)}
                      </span>
                    </div>
                    <p className="text-base font-bold text-foreground line-clamp-1 mb-3 flex-1 group-hover:text-primary transition-colors">
                      {visit.fo_note}
                    </p>
                    <div className="flex items-center justify-between border-t border-border/30 pt-3 mt-3">
                      {visit.doctor_profiles?.name ? (
                        <span className="text-sm font-medium text-sky-500 flex items-center gap-1.5">
                          <Stethoscope className="size-4" />
                          {visit.doctor_profiles.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic font-medium">
                          No doctor assigned
                        </span>
                      )}
                      {visit.doctor_note && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2.5 py-1 shrink-0 uppercase tracking-wider">
                          Diagnosed
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ViewContentCard>

          {/* Visit Detail Modal */}
          <ViewModal
            isOpen={!!selectedVisit}
            onClose={() => setSelectedVisit(null)}
            title="Visit Detail"
            description="Complete record of your visit"
            icon={<Activity className="size-6" />}
            badge={
              <span
                className={cn(
                  "inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-border/50",
                  selectedVisit
                    ? (STATUS_COLORS[selectedVisit.status] ??
                        "bg-muted text-muted-foreground")
                    : "",
                )}
              >
                {selectedVisit?.status?.replace(/_/g, " ")}
              </span>
            }
          >
            {selectedVisit && (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm bg-muted/20 px-4 py-3 rounded-xl border border-border/30">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Clock className="size-4 text-primary/70" />
                    {formatDate(selectedVisit.created_at)}
                  </div>
                  {selectedVisit.doctor_profiles?.name && (
                    <span className="text-sky-500 font-bold flex items-center gap-1.5">
                      <Stethoscope className="size-4" />
                      {selectedVisit.doctor_profiles.name}
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-border/40 bg-card px-5 py-4 shadow-sm">
                  <p className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider mb-2">
                    Complaint
                  </p>
                  <p className="text-sm font-medium">{selectedVisit.fo_note}</p>
                </div>

                {selectedVisit.doctor_note && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 px-5 py-4 shadow-inner">
                    <p className="font-bold text-primary text-[10px] uppercase tracking-wider mb-2">
                      Diagnosis & Treatment
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedVisit.doctor_note}
                    </p>
                  </div>
                )}

                {loadingDetail ? (
                  <div className="flex justify-center py-8 bg-muted/10 rounded-xl border border-border/30 shadow-inner">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {visitPrescriptions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Prescriptions
                          </p>
                          <div className="h-px bg-border/50 flex-1" />
                        </div>
                        <div className="rounded-xl border border-border/40 divide-y divide-border/30 shadow-sm overflow-hidden bg-card">
                          {visitPrescriptions.map((rx, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/10 transition-colors"
                            >
                              <div>
                                <p className="font-bold">{rx.name}</p>
                                {rx.notes && (
                                  <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                    {rx.notes}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <p className="text-xs font-medium text-muted-foreground border border-border/50 bg-muted/30 px-2 py-0.5 rounded-md inline-block mb-1">
                                  {rx.quantity}x @ Rp{" "}
                                  {rx.price.toLocaleString("id-ID")}
                                </p>
                                <p className="font-black text-primary">
                                  Rp{" "}
                                  {(rx.price * rx.quantity).toLocaleString(
                                    "id-ID",
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {visitQA.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Pre-Assessment Q&A
                          </p>
                          <div className="h-px bg-border/50 flex-1" />
                        </div>
                        <div className="space-y-3 p-4 bg-muted/10 rounded-xl border border-border/30">
                          {visitQA.map((item, i) => (
                            <div
                              key={i}
                              className={cn(
                                "rounded-xl px-4 py-3 text-sm shadow-sm border",
                                item.role === "user"
                                  ? "bg-primary text-primary-foreground ml-6 border-primary/20 rounded-tr-sm"
                                  : "bg-card mr-6 border-border/40 rounded-tl-sm",
                              )}
                            >
                              <p
                                className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70",
                                  item.role === "user"
                                    ? "text-primary-foreground/90"
                                    : "text-muted-foreground",
                                )}
                              >
                                {item.role === "user" ? "You" : "AI Assistant"}
                              </p>
                              <p className="leading-relaxed font-medium">
                                {item.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </ViewModal>
        </ViewMain>
      </ViewLayout>
    );
  }

  return null;
}

interface VisitPrescription {
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
  status: string;
}
