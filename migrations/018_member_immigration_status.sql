-- Add immigration status field to members
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS immigration_status text;

COMMENT ON COLUMN members.immigration_status IS 'Legal/immigration status: Cidadão, Residente Permanente, Com Visto, Em Processo, Outro';
