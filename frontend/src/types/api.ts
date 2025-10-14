// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User and Authentication Types
export interface User {
  user_id: string;
  email: string;
  role: 'ADMIN' | 'FACULTY' | 'CIR' | 'CLUB' | 'STUDENT';
  profile_type: 'STUDENT' | 'FACULTY' | 'ADMIN';
  profile_ref_id: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: string;
  profile_type: string;
  profile_ref_id: string;
}

// Student Types
export interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  department_id: string;
  department_name: string;
  department_code: string;
  semester: number;
  cgpa: number | null;
  attendance_percentage: number | null;
  research_experience: boolean;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
  skills?: Skill[];
  interests?: Interest[];
}

export interface StudentWithDetails extends Student {
  skills: Skill[];
  interests: Interest[];
  club_memberships: ClubMembership[];
  research_projects: ResearchProject[];
  internships: Internship[];
  achievements: Achievement[];
  certifications: Certification[];
  publications: Publication[];
  placements: Placement[];
}

export interface Skill {
  skill_id: string;
  name: string;
  description: string;
  category: string;
  proficiency_level?: string;
  acquired_date?: string;
  // Student-specific description of their experience with this skill
  student_description?: string;
}

export interface Interest {
  interest_id: string;
  name: string;
  description: string;
  category: string;
  // Student-specific description for this interest
  student_description?: string;
}

// Department Types
export interface Department {
  department_id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Company and Placement Types
export interface Company {
  company_id: string;
  name: string;
  description: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface JobRole {
  job_role_id: string;
  company_id: string;
  title: string;
  description: string;
  requirements: string;
  salary_range: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Placement {
  placement_id: string;
  student_id: string;
  company_id: string;
  job_role_id: string;
  status: 'APPLIED' | 'SHORTLISTED' | 'OFFERED' | 'ACCEPTED' | 'REJECTED';
  offer_type?: 'FULL_TIME' | 'INTERNSHIP' | null;
  applied_date: string;
  shortlisted_date: string | null;
  offered_date: string | null;
  accepted_date: string | null;
  rejected_date: string | null;
  created_at: string;
  updated_at: string;
  // Optional denormalized fields returned in student summary
  company_name?: string;
  job_title?: string;
}

// Club Types
export interface Club {
  club_id: string;
  name: string;
  description: string;
  category: string;
  established_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Optional aggregated members returned by backend getClubById
  members?: ClubMember[];
}

export interface ClubMembership {
  club_id: string;
  club_name: string;
  role: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

// Member shape for club members list (from getByIdWithMembers)
export interface ClubMember {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
}

// Research Types
export interface ResearchProject {
  project_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  status: string;
  role: string;
  participation_start_date: string;
  participation_end_date: string | null;
}

// Additional Student Data Types
export interface Internship {
  internship_id: string;
  company_name: string;
  position: string;
  start_date: string;
  end_date: string | null;
  description: string;
  is_verified: boolean;
}

export interface Achievement {
  achievement_id: string;
  title: string;
  description: string;
  achievement_date: string;
  category: string;
  is_verified: boolean;
}

export interface Certification {
  certification_id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string | null;
  credential_id: string;
  credential_url: string;
  is_verified: boolean;
}

export interface Publication {
  publication_id: string;
  title: string;
  authors: string;
  journal_conference: string;
  publication_date: string;
  doi: string;
  url: string;
  is_verified: boolean;
}

// Filter Types
export interface StudentFilters {
  q?: string;
  skills?: string;
  interests?: string;
  min_cgpa?: number;
  max_cgpa?: number;
  department_id?: string;
  semester?: number;
  research_experience?: boolean;
  min_attendance?: number;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

// Match Types
export interface MatchScore {
  skillScore: number;
  cgpaScore: number;
  attendanceScore: number;
  interestScore: number;
  match_score: number;
  matched_skills: Skill[];
  matched_interests: Interest[];
  matched_skills_count: number;
  matched_interests_count: number;
}

export interface MatchSettings {
  skill_weight: number;
  cgpa_weight: number;
  attendance_weight: number;
  interest_weight: number;
}

// ETL Types
export interface ETLRun {
  id: string;
  operation_type: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, any>;
  error_message: string | null;
  execution_time_ms: number | null;
}