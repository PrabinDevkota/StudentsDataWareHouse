-- Fix and (re)create club_invitations schema with proper FKs and uniqueness
-- Applies if previous migration failed or created incorrect references

BEGIN;

-- Drop broken table if it exists (e.g., wrong FK references)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'club_invitations'
  ) THEN
    DROP TABLE public.club_invitations CASCADE;
  END IF;
END$$;

-- Create table with correct columns and foreign keys
CREATE TABLE IF NOT EXISTS public.club_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL,
    student_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL, -- club user profile_ref_id
    responded_at TIMESTAMPTZ,
    responded_by UUID, -- student user id

    CONSTRAINT fk_invite_club FOREIGN KEY (club_id)
        REFERENCES public.clubs(club_id) ON DELETE CASCADE,
    CONSTRAINT fk_invite_student FOREIGN KEY (student_id)
        REFERENCES public.students(student_id) ON DELETE CASCADE,
    CONSTRAINT chk_invite_status CHECK (status IN ('PENDING','ACCEPTED','DECLINED','CANCELED'))
);

-- Ensure only one invitation row per (club_id, student_id)
ALTER TABLE public.club_invitations
  ADD CONSTRAINT uq_club_student UNIQUE (club_id, student_id);

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_invitation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invitation_set_updated_at ON public.club_invitations;
CREATE TRIGGER trg_invitation_set_updated_at
BEFORE UPDATE ON public.club_invitations
FOR EACH ROW EXECUTE FUNCTION public.set_invitation_updated_at();

COMMIT;