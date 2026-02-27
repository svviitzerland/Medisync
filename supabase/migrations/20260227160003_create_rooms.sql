-- TABLE: rooms
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type room_type NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- available, occupied, maintenance
    daily_price DECIMAL(10,2) DEFAULT 0
);

-- RLS: rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view rooms" 
ON rooms FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Staff can modify rooms" 
ON rooms FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'fo', 'doctor_specialist', 'nurse')
);
