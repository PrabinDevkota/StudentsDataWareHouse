-- Drop generic description columns from skills and interests
-- We now store per-student descriptions in junction tables

ALTER TABLE skills
  DROP COLUMN IF EXISTS description;

ALTER TABLE interests
  DROP COLUMN IF EXISTS description;