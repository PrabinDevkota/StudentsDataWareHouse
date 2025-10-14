-- Create placement_invitations table to manage CIR -> student job role suggestions
-- Status values: PENDING, ACCEPTED, DECLINED, CANCELED

BEGIN;

CREATE TABLE IF NOT EXISTS public.placement_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    job_role_id UUID,
    student_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL, -- CIR user profile_ref_id
    responded_at TIMESTAMPTZ,
    responded_by UUID, -- student user id

    CONSTRAINT fk_pi_company FOREIGN KEY (company_id)
        REFERENCES public.companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_pi_job_role FOREIGN KEY (job_role_id)
        REFERENCES public.company_job_roles(job_role_id) ON DELETE SET NULL,
    CONSTRAINT fk_pi_student FOREIGN KEY (student_id)
        REFERENCES public.students(student_id) ON DELETE CASCADE,
    CONSTRAINT chk_pi_status CHECK (status IN ('PENDING','ACCEPTED','DECLINED','CANCELED'))
);

-- Ensure only one invitation row per (company_id, student_id, job_role_id)
-- Note: job_role_id can be NULL; unique constraints treat NULLs as distinct, so allow multiple per company+student if role differs
CREATE UNIQUE INDEX IF NOT EXISTS uq_pi_company_student_role ON public.placement_invitations (company_id, student_id, job_role_id);

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.pi_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pi_set_updated_at ON public.placement_invitations;
CREATE TRIGGER trg_pi_set_updated_at
BEFORE UPDATE ON public.placement_invitations
FOR EACH ROW EXECUTE FUNCTION public.pi_set_updated_at();

COMMIT;