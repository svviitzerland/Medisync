import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole =
  | "admin"
  | "fo"
  | "doctor_specialist"
  | "nurse"
  | "pharmacist"
  | "patient";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
