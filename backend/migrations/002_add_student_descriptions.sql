-- Migration: Add student-specific description fields for skills and interests
-- Purpose: Allow each student to store their own description/details for an associated skill or interest

BEGIN;

-- Add student-specific description to student_skills
ALTER TABLE student_skills
  ADD COLUMN IF NOT EXISTS student_description TEXT;

-- Add student-specific description to student_interests
ALTER TABLE student_interests
  ADD COLUMN IF NOT EXISTS student_description TEXT;

-- Optional: indexes for future filtering/searching on student-specific descriptions
-- CREATE INDEX IF NOT EXISTS idx_student_skills_student_description ON student_skills USING GIN (to_tsvector('english', student_description));
-- CREATE INDEX IF NOT EXISTS idx_student_interests_student_description ON student_interests USING GIN (to_tsvector('english', student_description));

COMMIT;