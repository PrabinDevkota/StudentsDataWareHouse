-- Migration: Convert students.student_id from UUID to TEXT and remove student_number
-- Also update all referencing tables and constraints accordingly

BEGIN;

-- 1) Alter users.profile_ref_id to TEXT to allow non-UUID student IDs
ALTER TABLE public.users
  ALTER COLUMN profile_ref_id TYPE TEXT USING profile_ref_id::text;

-- 2) Drop all foreign key constraints that reference students.student_id
ALTER TABLE public.research_project_participants DROP CONSTRAINT IF EXISTS research_project_participants_student_id_fkey;
ALTER TABLE public.student_skills DROP CONSTRAINT IF EXISTS student_skills_student_id_fkey;
ALTER TABLE public.student_interests DROP CONSTRAINT IF EXISTS student_interests_student_id_fkey;
ALTER TABLE public.club_memberships DROP CONSTRAINT IF EXISTS club_memberships_student_id_fkey;
ALTER TABLE public.internships DROP CONSTRAINT IF EXISTS internships_student_id_fkey;
ALTER TABLE public.achievements DROP CONSTRAINT IF EXISTS achievements_student_id_fkey;
ALTER TABLE public.certifications DROP CONSTRAINT IF EXISTS certifications_student_id_fkey;
ALTER TABLE public.publications DROP CONSTRAINT IF EXISTS publications_student_id_fkey;
ALTER TABLE public.placements DROP CONSTRAINT IF EXISTS placements_student_id_fkey;
ALTER TABLE public.club_invitations DROP CONSTRAINT IF EXISTS fk_invite_student;
ALTER TABLE public.placement_invitations DROP CONSTRAINT IF EXISTS fk_pi_student;

-- 3) Alter students.student_id to TEXT and drop default; remove student_number
ALTER TABLE public.students
  ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.students
  ALTER COLUMN student_id DROP DEFAULT;
ALTER TABLE public.students
  DROP COLUMN IF EXISTS student_number;

-- 4) Alter referencing columns to TEXT
ALTER TABLE public.research_project_participants ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.student_skills ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.student_interests ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.club_memberships ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.internships ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.achievements ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.certifications ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.publications ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.placements ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.club_invitations ALTER COLUMN student_id TYPE TEXT USING student_id::text;
ALTER TABLE public.placement_invitations ALTER COLUMN student_id TYPE TEXT USING student_id::text;

-- 5) Re-create foreign keys referencing students(student_id)
ALTER TABLE public.research_project_participants
  ADD CONSTRAINT research_project_participants_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE public.student_skills
  ADD CONSTRAINT student_skills_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE public.student_interests
  ADD CONSTRAINT student_interests_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE public.club_memberships
  ADD CONSTRAINT club_memberships_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE public.internships
  ADD CONSTRAINT internships_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE public.achievements
  ADD CONSTRAINT achievements_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE public.certifications
  ADD CONSTRAINT certifications_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE public.publications
  ADD CONSTRAINT publications_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE public.placements
  ADD CONSTRAINT placements_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE public.club_invitations
  ADD CONSTRAINT fk_invite_student
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;
ALTER TABLE public.placement_invitations
  ADD CONSTRAINT fk_pi_student
    FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;

COMMIT;