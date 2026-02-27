/**
 * Centralized API client for all MediSync backend endpoints.
 * All functions throw an `ApiError` on non-2xx responses so callers can
 * catch and display meaningful messages to users.
 */

import { BACKEND_URL } from "@/lib/config";
import type { AIAnalysis, AdminStats } from "@/types";

// ─── Error Type ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

import { supabase } from "@/lib/supabase";

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.detail ?? `Request failed (${res.status})`,
    );
  }
  return data as T;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const authHeader = await getAuthHeader();
  return fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(body),
  }).then((res) => parseResponse<T>(res));
}

async function get<T>(path: string): Promise<T> {
  const authHeader = await getAuthHeader();
  return fetch(`${BACKEND_URL}${path}`, {
    headers: { ...authHeader },
  }).then((res) => parseResponse<T>(res));
}

// ─── AI Endpoints ────────────────────────────────────────────────────────────

export interface AnalyzeTicketResponse {
  status: "success" | "error";
  analysis?: AIAnalysis;
  message?: string;
}

/** POST /api/ai/analyze-ticket */
export function analyzeTicket(
  foNote: string,
  patientId: string | null,
): Promise<AnalyzeTicketResponse> {
  return post("/api/ai/analyze-ticket", {
    fo_note: foNote,
    patient_id: patientId ?? undefined,
  });
}

export interface AISuggestion {
  diagnosis: string;
  treatment_plan: string;
  medicines: Array<{ name: string; quantity: number; notes: string }>;
  requires_inpatient: boolean;
  reasoning: string;
}

export interface DoctorAssistResponse {
  status?: "success" | "error";
  suggestion?: AISuggestion;
  message?: string;
}

/** POST /api/ai/doctor-assist */
export function doctorAssist(
  nik: string,
  doctorDraft?: string,
): Promise<DoctorAssistResponse> {
  return post("/api/ai/doctor-assist", {
    nik,
    doctor_draft: doctorDraft || undefined,
  });
}

export interface PatientChatResponse {
  status?: "success" | "error";
  reply?: string;
  has_context?: boolean;
  ticket_id?: string;
  message?: string;
}

/** POST /api/ai/patient-chat */
export function patientChat(
  ticketId: string,
  message: string,
): Promise<PatientChatResponse> {
  return post("/api/ai/patient-chat", { ticket_id: ticketId, message });
}

// ─── Ticket Endpoints ────────────────────────────────────────────────────────

export interface CreateTicketPayload {
  patient_id: string;
  fo_note?: string;
  doctor_id?: string;
  requires_inpatient?: boolean;
  severity_level?: string;
  ai_reasoning?: string;
}

export interface CreateTicketResponse {
  status?: "success" | "error";
  ticket?: {
    id: number;
    patient_id?: string;
    fo_note?: string;
    doctor_id?: string;
    status?: string;
    severity_level?: string;
    ai_reasoning?: string;
    created_at?: string;
  };
  assigned_nurse_team?: string;
  detail?: string;
}

/** POST /api/tickets/create */
export function createTicket(
  payload: CreateTicketPayload,
): Promise<CreateTicketResponse> {
  return post("/api/tickets/create", payload);
}

export interface CompleteCheckupPayload {
  doctor_note: string;
  require_pharmacy?: boolean;
  requires_inpatient?: boolean;
}

/** POST /api/tickets/{ticket_id}/complete-checkup */
export function completeCheckup(
  ticketId: number,
  payload: CompleteCheckupPayload,
): Promise<unknown> {
  return post(`/api/tickets/${ticketId}/complete-checkup`, payload);
}

// ─── Patient Endpoints ───────────────────────────────────────────────────────

export interface RegisterPatientPayload {
  nik: string;
  name: string;
  age: number;
  phone: string;
}

export interface RegisterPatientResponse {
  patient?: { id: string };
  detail?: string;
}

/** POST /api/patients/register */
export function registerPatient(
  payload: RegisterPatientPayload,
): Promise<RegisterPatientResponse> {
  return post("/api/patients/register", payload);
}

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

/** GET /api/admin/stats — normalises API response `{patients, doctors, tickets, revenue}` to `AdminStats` */
export async function getAdminStats(): Promise<AdminStats> {
  const raw = await get<{
    patients: number;
    doctors: number;
    tickets: number;
    revenue: number;
  }>("/api/admin/stats");
  return {
    totalPatients: raw.patients,
    totalDoctors: raw.doctors,
    totalTickets: raw.tickets,
    totalRevenue: raw.revenue,
  };
}

// ─── Pre-Assessment Endpoints ─────────────────────────────────────────────────

export interface GenerateQuestionsResponse {
  status: "success" | "error";
  questions: string[];
}

/** POST /api/ai/generate-pre-assessment-questions */
export function generatePreAssessmentQuestions(
  complaint: string,
): Promise<GenerateQuestionsResponse> {
  return post("/api/ai/generate-pre-assessment-questions", complaint);
}

export interface QAHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface SubmitPreAssessmentResponse {
  status: "success" | "error";
  ticket_id?: string;
  assessment_id?: string;
  detail?: string;
}

/** POST /api/ai/submit-pre-assessment
 * Body: raw QA history array — array of `{role, content}` objects.
 */
export function submitPreAssessment(
  qaHistory: QAHistoryItem[],
): Promise<SubmitPreAssessmentResponse> {
  return post("/api/ai/submit-pre-assessment", qaHistory);
}

/** POST /api/tickets/{ticket_id}/assign-doctor */
export function assignDoctor(
  ticketId: number,
  doctorId: string,
): Promise<unknown> {
  return post(`/api/tickets/${ticketId}/assign-doctor`, doctorId);
}
