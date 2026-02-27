-- TABLE: tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    fo_note TEXT,
    doctor_note TEXT,
    status ticket_status DEFAULT 'draft',
    room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
    nurse_team_id INT REFERENCES nurse_teams(id) ON DELETE SET NULL,
    consultation_fee DECIMAL(10,2) DEFAULT 0,
    severity_level VARCHAR(20),
    ai_reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_patient ON tickets(patient_id);
CREATE INDEX idx_tickets_doctor ON tickets(doctor_id);
CREATE INDEX idx_tickets_status ON tickets(status);

-- RLS: tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own tickets" 
ON tickets FOR SELECT 
TO authenticated 
USING (auth.uid() = patient_id);

CREATE POLICY "Staff can view all tickets" 
ON tickets FOR SELECT 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'doctor_specialist', 'nurse', 'pharmacist', 'agent')
);

CREATE POLICY "Staff can insert tickets" 
ON tickets FOR INSERT 
TO authenticated 
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'agent')
);

CREATE POLICY "Staff can update tickets" 
ON tickets FOR UPDATE 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'doctor_specialist', 'nurse', 'pharmacist', 'agent')
);
