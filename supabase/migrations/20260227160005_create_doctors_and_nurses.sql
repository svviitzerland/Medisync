-- TABLE: doctors
CREATE TABLE doctors (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    specialization VARCHAR(100) NOT NULL
);

-- RLS: doctors
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view doctors" 
ON doctors FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins can modify doctors" 
ON doctors FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- TABLE: nurses
CREATE TABLE nurses (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    team_id INT REFERENCES nurse_teams(id) ON DELETE SET NULL,
    shift shift_type NOT NULL,
    telegram_id VARCHAR(100)
);

-- RLS: nurses
ALTER TABLE nurses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view nurses" 
ON nurses FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins can modify nurses" 
ON nurses FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
