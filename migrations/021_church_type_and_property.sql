-- Church type (Igreja vs Ponto de Pregação) and property ownership
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS church_type        text DEFAULT 'Igreja' CHECK (church_type IN ('Igreja', 'Ponto de Pregação')),
  ADD COLUMN IF NOT EXISTS property_ownership text CHECK (property_ownership IN ('Próprio', 'Alugado'));
