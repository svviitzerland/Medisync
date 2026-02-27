-- ENUMS
CREATE TYPE user_role AS ENUM ('patient', 'admin', 'fo', 'doctor_specialist', 'nurse', 'pharmacist', 'agent');
CREATE TYPE ticket_status AS ENUM ('draft', 'assigned_doctor', 'inpatient', 'operation', 'waiting_pharmacy', 'completed');
CREATE TYPE room_type AS ENUM ('inpatient', 'operation', 'consultation', 'icu', 'emergency');
CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'night');

-- TABLE: profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nik VARCHAR(16) UNIQUE, 
    role user_role NOT NULL DEFAULT 'patient',
    name VARCHAR(255) NOT NULL,
    age INT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_nik ON profiles(nik);

-- TRIGGER: Sinkronisasi auth.users ke profiles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nik, role, name, age, phone, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'nik',
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'patient'),
    new.raw_user_meta_data->>'name',
    (new.raw_user_meta_data->>'age')::int,
    new.raw_user_meta_data->>'phone',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'doctor_specialist', 'nurse', 'pharmacist')
);
