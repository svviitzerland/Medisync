// ─── Domain Types ────────────────────────────────────────────────────────────

export type TicketStatus =
  | "draft"
  | "assigned_doctor"
  | "in_progress"
  | "waiting_pharmacy"
  | "inpatient"
  | "completed"
  | "operation";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface PatientProfile {
  id: string;
  name: string;
  nik: string;
  age?: number;
}

export interface DoctorProfile {
  name: string;
  specialization?: string;
  profiles?: { name: string } | null;
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export interface Ticket {
  id: number;
  fo_note: string;
  doctor_note: string | null;
  status: TicketStatus;
  created_at: string;
  nurse_team_id?: string | null;
  profiles?: PatientProfile | null;
  doctors?: DoctorProfile | null;
}

// ─── AI Types ────────────────────────────────────────────────────────────────

export interface AIAnalysis {
  predicted_specialization?: string;
  recommended_doctor_id: string;
  recommended_doctor_name?: string;
  requires_inpatient: boolean;
  severity_level: SeverityLevel;
  reasoning: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalTickets: number;
  totalRevenue: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  doctor_fee: number;
  medicine_fee: number;
  room_fee: number;
  total_amount: number;
  status: "paid" | "unpaid";
  issued_at: string;
  tickets?: {
    id: string | number;
    fo_note: string;
    profiles?: { name: string } | null;
    patient_id?: string;
  } | null;
}

// ─── Pharmacy ────────────────────────────────────────────────────────────────

export interface Medicine {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
}

export interface Prescription {
  id: string;
  quantity: number;
  notes: string | null;
  status: string;
  catalog_medicines?: {
    name: string;
    unit: string;
    price: number;
  } | null;
  tickets?: {
    id: string;
    fo_note: string;
    doctor_note: string | null;
    profiles?: { name: string; nik: string } | null;
  } | null;
}

export interface GroupedPrescription {
  ticketId: string;
  patientName: string;
  nik: string;
  foNote: string;
  doctorNote: string | null;
  items: Prescription[];
}

// ─── Nurse ───────────────────────────────────────────────────────────────────

export interface WardPatient {
  id: string;
  status: TicketStatus;
  room_id: string | null;
  created_at: string;
  profiles?: { name: string; age: number } | null;
  rooms?: { name: string; type: string } | null;
}
