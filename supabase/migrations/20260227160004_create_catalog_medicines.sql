-- TABLE: catalog_medicines
CREATE TABLE catalog_medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0
);

-- RLS: catalog_medicines
ALTER TABLE catalog_medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view catalog" 
ON catalog_medicines FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Pharmacist and admin can modify catalog" 
ON catalog_medicines FOR ALL 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'pharmacist')
);
