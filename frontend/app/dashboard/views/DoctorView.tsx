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
  Plus,
  Trash2,
  Pill,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/config";
import {
  doctorAssist,
  completeCheckup,
  ApiError,
  type AISuggestion,
  type PrescriptionItem,
} from "@/lib/api";
import {
  ViewLayout,
  ViewMain,
  ViewHeader,
  ViewContentCard,
  ViewModal,
} from "@/components/dashboard/view-layout";
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
  doctor_profiles: {
    name: string;
    specialization: string;
  } | null;
}

interface CatalogMedicine {
  id: number;
  name: string;
  price: number;
  stock: number;
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
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  // Prescriptions
  const [medicines, setMedicines] = React.useState<CatalogMedicine[]>([]);
  const [prescriptions, setPrescriptions] = React.useState<
    (PrescriptionItem & { name?: string; price?: number })[]
  >([]);

  // History modal
  const [historyPatient, setHistoryPatient] =
    React.useState<PatientProfile | null>(null);
  const [history, setHistory] = React.useState<HistoryTicket[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  // AI Assist
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiSuggestion, setAiSuggestion] = React.useState<string | null>(null);

  // Pre-assessment Q&A
  const [preAssessmentQA, setPreAssessmentQA] = React.useState<{ role: string; content: string }[]>([]);
  const [showQA, setShowQA] = React.useState(false);

  React.useEffect(() => {
    if (!activeTab || activeTab === "patients") fetchMyTickets();
  }, [activeTab, userId]);

  // Load catalog medicines when exam modal opens
  React.useEffect(() => {
    if (selectedTicket) {
      fetchMedicines();
      // Fetch pre-assessment Q&A
      supabase
        .from("ai_pre_assessments")
        .select("qa_history")
        .eq("ticket_id", selectedTicket.id)
        .limit(1)
        .then(({ data }) => {
          setPreAssessmentQA(data?.[0]?.qa_history ?? []);
          setShowQA(false);
        });
    }
  }, [selectedTicket]);

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

  async function fetchMedicines() {
    const { data } = await supabase
      .from("catalog_medicines")
      .select("id, name, price, stock")
      .order("name");
    setMedicines((data as CatalogMedicine[]) ?? []);
  }

  async function handleViewHistory(patient: PatientProfile) {
    setHistoryPatient(patient);
    setLoadingHistory(true);
    const { data } = await supabase
      .from("tickets")
      .select(
        "id, fo_note, doctor_note, status, created_at, doctor_profiles:profiles!doctor_id(name, specialization)",
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
        const formatted = formatAISuggestion(data.suggestion);
        setAiSuggestion(formatted);
        if (!doctorNote) setDoctorNote(formatted);

        // Auto-fill prescriptions from AI suggestion
        if (data.suggestion.medicines?.length) {
          const aiPrescriptions: (PrescriptionItem & {
            name?: string;
            price?: number;
          })[] = [];
          for (const med of data.suggestion.medicines) {
            // Try to find matching medicine in catalog by name
            const match = medicines.find(
              (m) =>
                m.name.toLowerCase().includes(med.name.toLowerCase()) ||
                med.name.toLowerCase().includes(m.name.toLowerCase()),
            );
            if (match) {
              aiPrescriptions.push({
                medicine_id: match.id,
                quantity: med.quantity,
                notes: med.notes || "",
                name: match.name,
                price: match.price,
              });
            }
          }
          if (aiPrescriptions.length) {
            setPrescriptions(aiPrescriptions);
          }
        }
      }
    } catch {
      // AI assist is optional, silently fail
    } finally {
      setAiLoading(false);
    }
  }

  function addPrescription() {
    if (!medicines.length) return;
    const first = medicines[0];
    setPrescriptions((prev) => [
      ...prev,
      {
        medicine_id: first.id,
        quantity: 1,
        notes: "",
        name: first.name,
        price: first.price,
      },
    ]);
  }

  function updatePrescription(
    index: number,
    field: string,
    value: string | number,
  ) {
    setPrescriptions((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        if (field === "medicine_id") {
          const med = medicines.find((m) => m.id === Number(value));
          return {
            ...p,
            medicine_id: Number(value),
            name: med?.name,
            price: med?.price,
          };
        }
        return { ...p, [field]: value };
      }),
    );
  }

  function removePrescription(index: number) {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmitExamination() {
    if (!selectedTicket || !doctorNote.trim()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const rxPayload: PrescriptionItem[] = prescriptions.map((p) => ({
        medicine_id: p.medicine_id,
        quantity: p.quantity,
        notes: p.notes,
      }));

      await completeCheckup(selectedTicket.id, {
        doctor_note: doctorNote,
        prescriptions: rxPayload,
        doctor_fee: 150000,
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSelectedTicket(null);
        setDoctorNote("");
        setPrescriptions([]);
        setSubmitSuccess(false);
        setAiSuggestion(null);
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

  const totalMedicineFee = prescriptions.reduce(
    (sum, p) => sum + (p.price ?? 0) * p.quantity,
    0,
  );

  // ---- PATIENT QUEUE (default) ----
  return (
    <ViewLayout>
      <ViewMain className="max-w-4xl">
        <ViewHeader
          title="Patient Queue"
          description="Your assigned patients awaiting examination"
        >
          <Button
            variant="outline"
            onClick={fetchMyTickets}
            className="gap-2"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </ViewHeader>

        <ViewContentCard>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-xl border border-border/30 bg-muted/20"
                />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/50 bg-muted/5 text-muted-foreground">
              <Stethoscope className="size-10 opacity-30" />
              <p className="text-sm font-medium">No patients in your queue</p>
            </div>
          ) : (
            <div className="space-y-4">
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
                          setPrescriptions([]);
                          setSubmitError(null);
                          setSubmitSuccess(false);
                          setAiSuggestion(null);
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
        </ViewContentCard>
      </ViewMain>

      {/* Examination Modal */}
      <ViewModal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Examine: ${selectedTicket?.profiles?.name ?? "Patient"}`}
        description="Review triage, diagnose, and prescribe medicine"
        icon={<Stethoscope className="size-6" />}
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-5 text-sm shadow-inner">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-2">
                Patient Complaint
              </p>
              <p className="leading-relaxed text-foreground/90">{selectedTicket.fo_note}</p>
            </div>

            {/* Pre-assessment Q&A */}
            {preAssessmentQA.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowQA(!showQA)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <ChevronRight className={cn("size-3 transition-transform", showQA && "rotate-90")} />
                  Pre-Assessment Q&A ({preAssessmentQA.filter(q => q.role === "user").length} answers)
                </button>
                {showQA && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border border-border/30 p-3">
                    {preAssessmentQA.map((item, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm",
                          item.role === "user"
                            ? "bg-primary/10 ml-6"
                            : "bg-muted/30 mr-6",
                        )}
                      >
                        <p className="text-[10px] text-muted-foreground mb-0.5">
                          {item.role === "user" ? "Patient" : "AI"}
                        </p>
                        <p>{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
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
                placeholder="Enter diagnosis, treatment plan, and notes..."
                rows={4}
                className={cn(
                  "w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                  "resize-none transition-colors",
                )}
              />
            </div>

            {aiSuggestion && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground whitespace-pre-wrap">
                <span className="font-medium text-primary">
                  AI Suggestion:{" "}
                </span>
                {aiSuggestion}
              </div>
            )}

            {/* Prescriptions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Pill className="size-3.5" />
                  Prescriptions
                </Label>
                <button
                  onClick={addPrescription}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="size-3" />
                  Add Medicine
                </button>
              </div>

              {prescriptions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No prescriptions added. Click &quot;Add Medicine&quot; or use AI Assist.
                </p>
              ) : (
                <div className="space-y-2">
                  {prescriptions.map((rx, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-lg border border-border/40 bg-muted/10 p-3"
                    >
                      <div className="flex-1 space-y-2">
                        <select
                          value={rx.medicine_id}
                          onChange={(e) =>
                            updatePrescription(
                              idx,
                              "medicine_id",
                              Number(e.target.value),
                            )
                          }
                          className="w-full rounded-md border border-border/50 bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                          {medicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — Rp{" "}
                              {m.price.toLocaleString("id-ID")} (stock:{" "}
                              {m.stock})
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={1}
                            value={rx.quantity}
                            onChange={(e) =>
                              updatePrescription(
                                idx,
                                "quantity",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-20 rounded-md border border-border/50 bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                            placeholder="Qty"
                          />
                          <input
                            type="text"
                            value={rx.notes || ""}
                            onChange={(e) =>
                              updatePrescription(idx, "notes", e.target.value)
                            }
                            className="flex-1 rounded-md border border-border/50 bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                            placeholder="e.g. 3x daily after meals"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removePrescription(idx)}
                        className="mt-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}

                  {/* Total medicine fee */}
                  <div className="flex items-center justify-between text-sm px-1">
                    <span className="text-muted-foreground">
                      Medicine Total
                    </span>
                    <span className="font-semibold">
                      Rp {totalMedicineFee.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              )}
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
                Examination completed! Invoice generated.
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button
                size="lg"
                onClick={handleSubmitExamination}
                disabled={submitting || !doctorNote.trim() || submitSuccess}
                className="gap-2 w-full sm:w-auto mt-2"
              >
                {submitting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Send className="size-5" />
                )}
                {submitting ? "Completing..." : "Complete Examination"}
              </Button>
            </div>
          </div>
        )}
      </ViewModal>

      {/* Patient History Modal */}
      <ViewModal
        isOpen={!!historyPatient}
        onClose={() => {
          setHistoryPatient(null);
          setHistory([]);
        }}
        title={`Medical History: ${historyPatient?.name ?? "Patient"}`}
        description="Past visits, complaints, and diagnoses"
        icon={<History className="size-6" />}
      >
        {historyPatient && (
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-2xl border-border/40 bg-muted/10 text-muted-foreground">
                <History className="size-8 mb-3 opacity-20" />
                <p className="text-sm">No visit history found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-2xl border border-border/40 bg-muted/10 p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm",
                          STATUS_COLORS[h.status] ??
                          "bg-muted text-muted-foreground border-border",
                        )}
                      >
                        {h.status?.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatDate(h.created_at)}
                      </span>
                    </div>
                    <div className="rounded-xl bg-background/50 p-3 border border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">FO Complaint</p>
                      <p className="text-sm text-foreground/90">{h.fo_note}</p>
                    </div>
                    {h.doctor_note && (
                      <div className="rounded-xl bg-primary/5 p-3 border border-primary/20">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Doctor Diagnosis / Notes</p>
                        <p className="text-sm text-foreground/90">{h.doctor_note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ViewModal>
    </ViewLayout>
  );
}

function formatAISuggestion(s: AISuggestion): string {
  const medicineList = s.medicines
    .map(
      (m) =>
        `  - ${m.name} (qty: ${m.quantity})${m.notes ? ` — ${m.notes}` : ""}`,
    )
    .join("\n");
  return [
    `Diagnosis: ${s.diagnosis}`,
    ``,
    `Treatment Plan:\n${s.treatment_plan}`,
    medicineList ? `\nMedicines:\n${medicineList}` : "",
    ``,
    `Requires Inpatient: ${s.requires_inpatient ? "Yes" : "No"}`,
    `\nReasoning: ${s.reasoning}`,
  ]
    .filter(Boolean)
    .join("\n");
}

