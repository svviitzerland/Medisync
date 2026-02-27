-- TABLE: ai_pre_assessments
CREATE TABLE ai_pre_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    qa_history JSONB NOT NULL DEFAULT '[]',
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticket_id)
);

-- RLS: ai_pre_assessments
ALTER TABLE ai_pre_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own assessments" 
ON ai_pre_assessments FOR SELECT 
TO authenticated 
USING (auth.uid() = patient_id);

CREATE POLICY "Staff can view all assessments" 
ON ai_pre_assessments FOR SELECT 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'doctor_specialist', 'nurse', 'pharmacist', 'agent')
);

CREATE POLICY "Staff can insert assessments" 
ON ai_pre_assessments FOR INSERT 
TO authenticated 
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'doctor_specialist', 'agent')
);

CREATE POLICY "Staff can update assessments" 
ON ai_pre_assessments FOR UPDATE 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'doctor_specialist', 'agent')
);
