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

function post<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((res) => parseResponse<T>(res));
}

function get<T>(path: string): Promise<T> {
  return fetch(`${BACKEND_URL}${path}`).then((res) => parseResponse<T>(res));
}

// ─── AI Endpoints ────────────────────────────────────────────────────────────

export interface AnalyzeTicketResponse {
  status: "ok" | "error";
  analysis: AIAnalysis;
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

export interface DoctorAssistResponse {
  suggestion?: string;
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
  reply?: string;
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
  ticket?: { id: number };
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

/** GET /api/admin/stats */
export function getAdminStats(): Promise<AdminStats> {
  return get("/api/admin/stats");
}
