-- TABLE: prescriptions
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    medicine_id INT REFERENCES catalog_medicines(id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own prescriptions" 
ON prescriptions FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM tickets 
        WHERE tickets.id = ticket_id AND tickets.patient_id = auth.uid()
    )
);

CREATE POLICY "Staff can view all prescriptions" 
ON prescriptions FOR SELECT 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'doctor_specialist', 'nurse', 'pharmacist')
);

CREATE POLICY "Doctors and Pharmacists and Admins can insert/update prescriptions" 
ON prescriptions FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'doctor_specialist', 'pharmacist')
);
