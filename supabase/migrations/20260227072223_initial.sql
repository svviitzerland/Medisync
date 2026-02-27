-- ENUMS
CREATE TYPE user_role AS ENUM ('patient', 'admin', 'fo', 'doctor_specialist', 'nurse', 'pharmacist', 'agent');
CREATE TYPE ticket_status AS ENUM ('draft', 'assigned_doctor', 'inpatient', 'operation', 'waiting_pharmacy', 'completed');
CREATE TYPE room_type AS ENUM ('inpatient', 'operation', 'consultation', 'icu', 'emergency');
CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'night');

-- TABLE: profiles
-- Hubungan 1-to-1 dengan auth.users untuk menyimpan data metadata pengguna
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nik VARCHAR(16) UNIQUE, -- Nomor Induk Kependudukan sebagai index
    role user_role NOT NULL DEFAULT 'patient',
    name VARCHAR(255) NOT NULL,
    age INT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index utama untuk pencarian dengan NIK
CREATE INDEX idx_profiles_nik ON profiles(nik);

-- TABLE: doctors
-- Tambahan informasi untuk role dokter spesialis
CREATE TABLE doctors (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    specialization VARCHAR(100) NOT NULL
);

-- TABLE: nurse_teams
-- Tim perawat yang akan di-assign ke ruangan. Terbagi jadi shift dsb.
CREATE TABLE nurse_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- TABLE: nurses
-- Data tambahan untuk perawat
CREATE TABLE nurses (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    team_id INT REFERENCES nurse_teams(id) ON DELETE SET NULL,
    shift shift_type NOT NULL,
    telegram_id VARCHAR(100) -- Untuk notifikasi/panggilan otomatis
);

-- TABLE: rooms
-- Data semua kamar, dari inap, operasi, icu, konsultasi
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type room_type NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- available, occupied, maintenance
    daily_price DECIMAL(10,2) DEFAULT 0
);

-- TABLE: tickets (Medical Cases / Kunjungan)
-- Pasient bisa memiliki lebih dari 1 tiket jika keluhannya berbeda (ke dokter beda)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    fo_note TEXT,             -- Hasil analisis dan catatan dari FO
    doctor_note TEXT,         -- Hasil diagnosa, instruksi kamar dari dokter spesialis
    status ticket_status DEFAULT 'draft',
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,     -- Dokter Spesialis yang diassign agent
    room_id INT REFERENCES rooms(id) ON DELETE SET NULL,          -- Ruangan (Inap/Operasi) saat ini
    nurse_team_id INT REFERENCES nurse_teams(id) ON DELETE SET NULL, -- Tim Perawat yang menangani kalau inap
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: catalog_medicines
-- List obat-obatan
CREATE TABLE catalog_medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0
);

-- TABLE: prescriptions
-- Resep / obat yang diresepkan oleh dokter untuk tiket tertentu
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    medicine_id INT REFERENCES catalog_medicines(id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1,
    notes TEXT, -- misal: diminum 3x sehari sesudah makan
    status VARCHAR(50) DEFAULT 'pending', -- pending, dispensed (diberikan oleh apoteker)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: invoices
-- Rincian biaya ketika tiketnya ditandai done
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    doctor_fee DECIMAL(10,2) DEFAULT 0,
    medicine_fee DECIMAL(10,2) DEFAULT 0,
    room_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, paid
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: chat_messages
-- Menyimpan history chatbox pasien
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    sender VARCHAR(50) NOT NULL, -- 'patient' atau 'ai'
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGER: Sinkronisasi pembuat user dari Supabase Auth ke tabel Profile
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

-- TRIGGER: Perhitungan otomatis untuk grand total invoice 
CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_amount = NEW.doctor_fee + NEW.medicine_fee + NEW.room_fee;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_total_amount
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE PROCEDURE update_invoice_total();
