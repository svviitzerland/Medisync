-- TABLE: invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    doctor_fee DECIMAL(10,2) DEFAULT 0,
    medicine_fee DECIMAL(10,2) DEFAULT 0,
    room_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'unpaid',
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- RLS: invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own invoices" 
ON invoices FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM tickets 
        WHERE tickets.id = ticket_id AND tickets.patient_id = auth.uid()
    )
);

CREATE POLICY "Staff can view all invoices" 
ON invoices FOR SELECT 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'pharmacist', 'doctor_specialist', 'nurse')
);

CREATE POLICY "Admin, FO, and Doctors can insert/update invoices" 
ON invoices FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'doctor_specialist')
);
