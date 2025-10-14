-- MySQL schema translated from PostgreSQL schema.sql
-- Target: MySQL 8.0+, InnoDB, utf8mb4

-- Note: PostgreSQL-specific types and functions were converted:
-- - uuid -> CHAR(36) with DEFAULT (UUID())
-- - text -> TEXT or VARCHAR
-- - character varying(n) -> VARCHAR(n)
-- - timestamp with time zone -> TIMESTAMP (naive) with DEFAULT CURRENT_TIMESTAMP
-- - numeric(p, s) -> DECIMAL(p, s)
-- - jsonb -> JSON
-- - enums (offer_type, placement_status) replaced by VARCHAR(50)
-- - COLLATE pg_catalog."default" removed
-- - MATCH SIMPLE removed in FKs

-- Tables

CREATE TABLE IF NOT EXISTS achievements (
  achievement_id CHAR(36) NOT NULL DEFAULT (UUID()),
  student_id VARCHAR(255),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  achievement_date DATE NOT NULL,
  category VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS certifications (
  certification_id CHAR(36) NOT NULL DEFAULT (UUID()),
  student_id VARCHAR(255),
  name VARCHAR(300) NOT NULL,
  issuing_organization VARCHAR(200) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  credential_id VARCHAR(200),
  credential_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (certification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS club_invitations (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  club_id CHAR(36) NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36) NOT NULL,
  responded_at TIMESTAMP NULL,
  responded_by CHAR(36),
  role VARCHAR(100),
  PRIMARY KEY (id),
  UNIQUE KEY uq_club_student (club_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS club_memberships (
  club_id CHAR(36) NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (club_id, student_id, start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clubs (
  club_id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  established_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (club_id),
  UNIQUE KEY clubs_name_key (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS companies (
  company_id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50),
  location VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id),
  UNIQUE KEY companies_name_key (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS company_job_roles (
  job_role_id CHAR(36) NOT NULL DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  requirements TEXT,
  salary_range VARCHAR(100),
  location VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  role_type VARCHAR(50),
  PRIMARY KEY (job_role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS departments (
  department_id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (department_id),
  UNIQUE KEY departments_code_key (code),
  UNIQUE KEY departments_name_key (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS etl_runs (
  run_id CHAR(36) NOT NULL DEFAULT (UUID()),
  operation_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  records_processed INT DEFAULT 0,
  error_message TEXT,
  metadata JSON,
  PRIMARY KEY (run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS faculty (
  faculty_id CHAR(36) NOT NULL DEFAULT (UUID()),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  department_id CHAR(36),
  designation VARCHAR(100),
  specialization TEXT,
  avatar_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (faculty_id),
  UNIQUE KEY faculty_email_key (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS interests (
  interest_id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (interest_id),
  UNIQUE KEY interests_name_key (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS internships (
  internship_id CHAR(36) NOT NULL DEFAULT (UUID()),
  student_id VARCHAR(255),
  company_name VARCHAR(200) NOT NULL,
  `position` VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (internship_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS match_settings (
  setting_id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  skill_weight DECIMAL(3,2) DEFAULT 0.30,
  cgpa_weight DECIMAL(3,2) DEFAULT 0.25,
  attendance_weight DECIMAL(3,2) DEFAULT 0.20,
  interest_weight DECIMAL(3,2) DEFAULT 0.25,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_id),
  UNIQUE KEY match_settings_name_key (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS migration_logs (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  migration_name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  execution_time_ms INT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS placement_invitations (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  job_role_id CHAR(36),
  student_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36) NOT NULL,
  responded_at TIMESTAMP NULL,
  responded_by CHAR(36),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS placements (
  placement_id CHAR(36) NOT NULL DEFAULT (UUID()),
  student_id VARCHAR(255),
  company_id CHAR(36),
  job_role_id CHAR(36),
  status VARCHAR(50) NOT NULL,
  applied_date DATE NOT NULL,
  shortlisted_date DATE,
  offered_date DATE,
  accepted_date DATE,
  rejected_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  offer_type VARCHAR(50),
  PRIMARY KEY (placement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS publications (
  publication_id CHAR(36) NOT NULL DEFAULT (UUID()),
  student_id VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  authors TEXT,
  journal_conference VARCHAR(300),
  publication_date DATE,
  doi VARCHAR(200),
  url VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (publication_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS research_project_participants (
  project_id CHAR(36) NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  start_date DATE,
  end_date DATE,
  PRIMARY KEY (project_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS research_project_required_skills (
  project_id CHAR(36) NOT NULL,
  skill_id CHAR(36) NOT NULL,
  PRIMARY KEY (project_id, skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS research_projects (
  project_id CHAR(36) NOT NULL DEFAULT (UUID()),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  faculty_id CHAR(36),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS skills (
  skill_id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (skill_id),
  UNIQUE KEY skills_name_key (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_interests (
  student_id VARCHAR(255) NOT NULL,
  interest_id CHAR(36) NOT NULL,
  student_description TEXT,
  PRIMARY KEY (student_id, interest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS student_skills (
  student_id VARCHAR(255) NOT NULL,
  skill_id CHAR(36) NOT NULL,
  proficiency_level VARCHAR(20) DEFAULT 'INTERMEDIATE',
  acquired_date DATE DEFAULT (CURRENT_DATE),
  student_description TEXT,
  PRIMARY KEY (student_id, skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  dob DATE,
  gender VARCHAR(20),
  department_id CHAR(36),
  semester INT,
  cgpa DECIMAL(3,2),
  attendance_percentage DECIMAL(5,2),
  research_experience BOOLEAN DEFAULT FALSE,
  avatar_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id),
  UNIQUE KEY students_email_key (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  user_id CHAR(36) NOT NULL DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  profile_type VARCHAR(20) NOT NULL,
  profile_ref_id VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY users_email_key (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes

CREATE INDEX idx_company_job_roles_company_id ON company_job_roles(company_id);
CREATE INDEX idx_research_project_participants_project_id ON research_project_participants(project_id);
CREATE INDEX idx_research_project_participants_student_id ON research_project_participants(student_id);
CREATE INDEX idx_student_interests_interest_id ON student_interests(interest_id);
CREATE INDEX idx_student_interests_student_id ON student_interests(student_id);
CREATE INDEX idx_student_skills_skill_id ON student_skills(skill_id);
CREATE INDEX idx_student_skills_student_id ON student_skills(student_id);
CREATE INDEX idx_students_department_id ON students(department_id);

-- Foreign Keys

ALTER TABLE achievements
  ADD CONSTRAINT achievements_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE certifications
  ADD CONSTRAINT certifications_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE club_invitations
  ADD CONSTRAINT fk_invite_club
  FOREIGN KEY (club_id) REFERENCES clubs (club_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE club_invitations
  ADD CONSTRAINT fk_invite_student
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE club_memberships
  ADD CONSTRAINT club_memberships_club_id_fkey
  FOREIGN KEY (club_id) REFERENCES clubs (club_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE club_memberships
  ADD CONSTRAINT club_memberships_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE company_job_roles
  ADD CONSTRAINT company_job_roles_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES companies (company_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE faculty
  ADD CONSTRAINT faculty_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES departments (department_id)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE internships
  ADD CONSTRAINT internships_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE placement_invitations
  ADD CONSTRAINT fk_pi_company
  FOREIGN KEY (company_id) REFERENCES companies (company_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE placement_invitations
  ADD CONSTRAINT fk_pi_job_role
  FOREIGN KEY (job_role_id) REFERENCES company_job_roles (job_role_id)
  ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE placement_invitations
  ADD CONSTRAINT fk_pi_student
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE placements
  ADD CONSTRAINT placements_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES companies (company_id)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE placements
  ADD CONSTRAINT placements_job_role_id_fkey
  FOREIGN KEY (job_role_id) REFERENCES company_job_roles (job_role_id)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE placements
  ADD CONSTRAINT placements_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE publications
  ADD CONSTRAINT publications_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE research_project_participants
  ADD CONSTRAINT research_project_participants_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES research_projects (project_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE research_project_participants
  ADD CONSTRAINT research_project_participants_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE research_project_required_skills
  ADD CONSTRAINT research_project_required_skills_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES research_projects (project_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE research_project_required_skills
  ADD CONSTRAINT research_project_required_skills_skill_id_fkey
  FOREIGN KEY (skill_id) REFERENCES skills (skill_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE research_projects
  ADD CONSTRAINT research_projects_faculty_id_fkey
  FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE student_interests
  ADD CONSTRAINT student_interests_interest_id_fkey
  FOREIGN KEY (interest_id) REFERENCES interests (interest_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE student_interests
  ADD CONSTRAINT student_interests_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE student_skills
  ADD CONSTRAINT student_skills_skill_id_fkey
  FOREIGN KEY (skill_id) REFERENCES skills (skill_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE student_skills
  ADD CONSTRAINT student_skills_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students (student_id)
  ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE students
  ADD CONSTRAINT students_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES departments (department_id)
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Seed core departments (safe to run multiple times)
-- Uses INSERT IGNORE to avoid errors if departments already exist
INSERT IGNORE INTO departments (department_id, name, code, description) VALUES
  (UUID(), 'Computer Science and Engineering', 'CSE', 'Computer Science and Engineering'),
  (UUID(), 'Electronics & Communication Engineering', 'ECE', 'Electronics & Communication Engineering'),
  (UUID(), 'Electrical and Electronics Engineering', 'EEE', 'Electrical and Electronics Engineering'),
  (UUID(), 'Mechanical Engineering', 'ME', 'Mechanical Engineering'),
  (UUID(), 'School of Artificial Intelligence', 'SAI', 'School of Artificial Intelligence');
