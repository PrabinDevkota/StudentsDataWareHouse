-- Migration: 006_add_offer_type_to_placements_and_role_type_to_company_job_roles.sql
-- Description: Add offer_type enum and column to placements; add role_type to company_job_roles

BEGIN;

-- Create offer_type enum if not exists
DO $$ BEGIN
    CREATE TYPE offer_type AS ENUM ('FULL_TIME', 'INTERNSHIP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add offer_type column to placements if not exists
ALTER TABLE public.placements
  ADD COLUMN IF NOT EXISTS offer_type offer_type;

-- Backfill data: for existing placements with status OFFERED or ACCEPTED and no offer_type,
-- set a sensible default to ensure the upcoming constraint does not fail.
-- We choose FULL_TIME as a safe default; this can be updated per-record later via the UI.
UPDATE public.placements
SET offer_type = 'FULL_TIME'
WHERE status IN ('OFFERED','ACCEPTED') AND offer_type IS NULL;

-- Ensure offered_date exists (already in initial schema); no changes needed

-- Add constraint: if status is OFFERED or ACCEPTED, offer_type must be present
DO $$ BEGIN
    ALTER TABLE public.placements
      ADD CONSTRAINT check_offer_type_when_offered_or_accepted
      CHECK (
        (status IN ('OFFERED','ACCEPTED') AND offer_type IS NOT NULL)
        OR (status NOT IN ('OFFERED','ACCEPTED'))
      );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role_type column to company_job_roles to indicate if a role is FTE or Internship
ALTER TABLE public.company_job_roles
  ADD COLUMN IF NOT EXISTS role_type offer_type;

COMMIT;