-- ENUMS
CREATE TYPE user_role AS ENUM ('patient', 'admin', 'fo', 'doctor_specialist', 'nurse', 'pharmacist', 'agent');
CREATE TYPE ticket_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE room_type AS ENUM ('inpatient', 'operation', 'consultation', 'icu', 'emergency');
CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'night');

-- TABLE: profiles
-- Unified table for ALL users. Role-specific columns are nullable.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nik VARCHAR(16) UNIQUE, 
    role user_role NOT NULL DEFAULT 'patient',
    name VARCHAR(255) NOT NULL,
    age INT,
    phone VARCHAR(20),
    email VARCHAR(255),

    -- Doctor-specific
    specialization VARCHAR(100),

    -- Nurse-specific
    team_id INT,               -- will be FK'd after nurse_teams is created
    shift shift_type,
    telegram_id VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_nik ON profiles(nik);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_specialization ON profiles(specialization);

-- TRIGGER: Sync auth.users → profiles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nik, role, name, age, phone, email, specialization)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'nik',
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'patient'),
    new.raw_user_meta_data->>'name',
    (new.raw_user_meta_data->>'age')::int,
    new.raw_user_meta_data->>'phone',
    new.email,
    new.raw_user_meta_data->>'specialization'
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

