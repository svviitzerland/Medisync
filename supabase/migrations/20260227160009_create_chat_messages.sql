-- TABLE: chat_messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    sender VARCHAR(50) NOT NULL, -- 'patient' atau 'ai'
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own chat messages" 
ON chat_messages FOR SELECT 
TO authenticated 
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert chat messages" 
ON chat_messages FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Staff can view all chat messages" 
ON chat_messages FOR SELECT 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'doctor_specialist', 'nurse', 'agent')
);

CREATE POLICY "Agents can insert chat messages" 
ON chat_messages FOR INSERT 
TO authenticated 
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'agent')
);
