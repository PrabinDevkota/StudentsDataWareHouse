-- Migration: 005_add_role_to_club_invitations.sql
-- Description: Add role column to club_invitations to allow clubs to assign roles in invitations

BEGIN;

-- Add role column if it doesn't exist
ALTER TABLE public.club_invitations
  ADD COLUMN IF NOT EXISTS role TEXT;

-- Optional: set default role for existing rows to 'Member' where null
UPDATE public.club_invitations SET role = COALESCE(role, 'Member');

COMMIT;