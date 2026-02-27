-- TABLE: nurse_teams
CREATE TABLE nurse_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- RLS: nurse_teams
ALTER TABLE nurse_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view nurse teams" 
ON nurse_teams FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Only admins can modify nurse teams" 
ON nurse_teams FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
