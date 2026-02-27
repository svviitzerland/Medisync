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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/config";
import { patientChat, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import type { ChatMessage, Invoice as InvoiceType } from "@/types";

interface VisitTicket {
  id: string;
  fo_note: string;
  status: string;
  created_at: string;
  doctor_note: string | null;
  profiles: { name: string } | null;
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

  // AI Chat state
  const [chatTickets, setChatTickets] = React.useState<VisitTicket[]>([]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [selectedChatTicket, setSelectedChatTicket] =
    React.useState<VisitTicket | null>(null);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatSending, setChatSending] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!activeTab || activeTab === "visits") fetchVisits();
    else if (activeTab === "billing") fetchInvoices();
    else if (activeTab === "chat") fetchChatTickets();
  }, [activeTab, userId]);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function fetchVisits() {
    setLoading(true);
    const { data } = await supabase
      .from("tickets")
      .select(
        "id, fo_note, status, created_at, doctor_note, profiles!doctor_id(name)",
      )
      .eq("patient_id", userId)
      .order("created_at", { ascending: false });
    setVisits((data as unknown as VisitTicket[]) ?? []);
    setLoading(false);
  }

  async function fetchInvoices() {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select(
        "id, doctor_fee, medicine_fee, room_fee, status, issued_at, tickets(id, fo_note)",
      )
      .order("issued_at", { ascending: false });

    // Filter client-side to patient's own invoices (Supabase nested filter limitation)
    const filtered = ((data as unknown as PatientInvoice[]) ?? []).filter(
      (inv) => inv.tickets !== null,
    );
    setInvoices(filtered);
    setLoading(false);
  }

  function formatDate(d: string) {
    return formatDateTime(d);
  }

  async function fetchChatTickets() {
    setChatLoading(true);
    const { data } = await supabase
      .from("tickets")
      .select(
        "id, fo_note, status, created_at, doctor_note, profiles!doctor_id(name)",
      )
      .eq("patient_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    setChatTickets((data as unknown as VisitTicket[]) ?? []);
    setChatLoading(false);
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

  // ---- BILLING TAB ----
  if (activeTab === "billing") {
    const totalPaid = invoices
      .filter((i) => i.status === "paid")
      .reduce(
        (s, i) =>
          s + (i.doctor_fee ?? 0) + (i.medicine_fee ?? 0) + (i.room_fee ?? 0),
        0,
      );

    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Billing History</h2>
            <p className="text-sm text-muted-foreground mt-1">
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
            <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-400/10">
                <CheckCircle2 className="size-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-sm font-bold">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-sky-400/10">
                <CreditCard className="size-4 text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invoices</p>
                <p className="text-xl font-bold">{invoices.length}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-rose-400/10">
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
                className="h-28 animate-pulse rounded-xl border border-border/30 bg-card"
              />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-border/50 text-muted-foreground">
            <CreditCard className="size-10 opacity-30" />
            <p className="text-sm">No billing records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => {
              const total =
                (inv.doctor_fee ?? 0) +
                (inv.medicine_fee ?? 0) +
                (inv.room_fee ?? 0);
              return (
                <div
                  key={inv.id}
                  className="rounded-xl border border-border/40 bg-card p-4 space-y-3"
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

                  <div className="grid grid-cols-3 gap-3 rounded-lg border border-border/30 bg-muted/20 p-3 text-sm">
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
                    <span className="font-bold text-base">
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
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-xl font-semibold">Ask AI About Your Visit</h2>
          <p className="text-sm text-muted-foreground mt-1">
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
            {chatLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl border border-border/30 bg-card"
                  />
                ))}
              </div>
            ) : chatTickets.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-border/50 text-muted-foreground">
                <MessageCircle className="size-10 opacity-30" />
                <p className="text-sm">No visits available to chat about</p>
              </div>
            ) : (
              chatTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  className="w-full text-left rounded-xl border border-border/40 bg-card p-4 hover:bg-muted/20 transition-colors space-y-1.5"
                  onClick={() => {
                    setSelectedChatTicket(ticket);
                    setChatMessages([]);
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {ticket.profiles?.name && (
                      <span className="text-xs text-muted-foreground">
                        Dr. {ticket.profiles.name}
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
            className="flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden"
            style={{ height: "calc(100vh - 280px)", minHeight: "440px" }}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">MediSync AI</p>
                  <p className="text-xs text-muted-foreground truncate">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <Bot className="size-10 opacity-30" />
                  <p className="text-sm text-center max-w-xs">
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
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Bot className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/40 p-3">
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <textarea
                  className="flex-1 resize-none rounded-xl border border-border/50 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-10 max-h-32"
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
                  className="h-10 w-10 shrink-0"
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Medical Status</h2>
          <p className="text-sm text-muted-foreground mt-1">
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
              className="h-32 animate-pulse rounded-xl border border-border/30 bg-card"
            />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-border/50 text-muted-foreground">
          <Activity className="size-10 opacity-30" />
          <p className="text-sm">No visit history found</p>
        </div>
      ) : (
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-5 top-6 bottom-6 w-px bg-border/40 translate-x-px" />

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
              <div className="flex-1 rounded-xl border border-border/40 bg-card p-4 space-y-2 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
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
                  {visit.profiles?.name && (
                    <span className="text-xs text-muted-foreground">
                      Dr. {visit.profiles.name}
                    </span>
                  )}
                </div>

                <p className="text-sm">
                  <span className="text-muted-foreground">Complaint: </span>
                  {visit.fo_note}
                </p>

                {visit.doctor_note && (
                  <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2.5 text-sm">
                    <p className="text-xs font-medium text-primary mb-1">
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
