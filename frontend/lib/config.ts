// ─── Environment ─────────────────────────────────────────────────────────────

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

// ─── Ticket Status ───────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  in_progress: "bg-sky-500/15 text-sky-400",
  completed: "bg-emerald-500/15 text-emerald-400",
};

// ─── Severity ────────────────────────────────────────────────────────────────

export const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

// ─── Roles ───────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  fo: "Front Office",
  doctor_specialist: "Doctor",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  patient: "Patient",
  agent: "AI Agent",
};

export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-rose-500/15 text-rose-400",
  fo: "bg-violet-500/15 text-violet-400",
  doctor_specialist: "bg-sky-500/15 text-sky-400",
  nurse: "bg-emerald-500/15 text-emerald-400",
  pharmacist: "bg-amber-500/15 text-amber-400",
  patient: "bg-teal-500/15 text-teal-400",
  agent: "bg-indigo-500/15 text-indigo-400",
};
