import { api } from './axios';

// Define types locally to avoid import issues
interface Placement {
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
}

interface Company {
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

interface JobRole {
  job_role_id: string;
  company_id: string;
  title: string;
  description: string;
  requirements: string;
  salary_range: string;
  location: string;
  role_type?: 'FULL_TIME' | 'INTERNSHIP' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MatchScore {
  skillScore: number;
  cgpaScore: number;
  interestScore: number;
  match_score: number;
  matched_skills: any[];
  matched_interests: any[];
  matched_skills_count: number;
  matched_interests_count: number;
}

interface PaginatedResponse<T> {
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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

export const placementsApi = {
  // Get all placements
  getPlacements: (filters: {
    page?: number;
    limit?: number;
    status?: string;
    company_id?: string;
    student_id?: string;
    job_role_id?: string;
  } = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return api.get<PaginatedResponse<Placement>>(`/placements?${params.toString()}`);
  },

  // Get placement by ID
  getPlacementById: (id: string) => {
    return api.get<Placement>(`/placements/${id}`);
  },

  // Create new placement
  createPlacement: (placementData: {
    company_id: string;
    job_role_id: string;
    student_id: string;
    status?: 'APPLIED' | 'SHORTLISTED' | 'OFFERED' | 'ACCEPTED' | 'REJECTED';
    applied_date?: string;
    offered_date?: string;
    offer_type?: 'FULL_TIME' | 'INTERNSHIP';
    description?: string;
  }) => {
    return api.post<Placement>('/placements', placementData);
  },

  // Update placement status
  updatePlacementStatus: (
    id: string,
    status: string,
    options: { acceptedDate?: string; offerType?: 'FULL_TIME' | 'INTERNSHIP'; offeredDate?: string } = {}
  ) => {
    const payload: any = { status };
    if (options.acceptedDate) payload.accepted_date = options.acceptedDate;
    if (options.offerType) payload.offer_type = options.offerType;
    if (options.offeredDate) payload.offered_date = options.offeredDate;

    return api.put<Placement>(`/placements/${id}/status`, payload);
  },

  // Get placement statistics
  getPlacementStats: () => {
    return api.get<{
      total_applications: number;
      shortlisted: number;
      offered: number;
      accepted: number;
      rejected: number;
      by_department: Record<string, number>;
      by_company: Record<string, number>;
    }>('/placements/stats/summary');
  },

  // Get companies (paginated response with meta)
  getCompanies: () => {
    return api.get<{ companies: Company[]; meta: any }>('/companies');
  },

  // Get company by ID (includes job_roles array)
  getCompanyById: (id: string) => {
    return api.get<Company & { job_roles: JobRole[] }>(`/companies/${id}`);
  },

  // Get company job roles via company details (backend has no separate GET route)
  getCompanyJobRoles: (companyId: string) => {
    return api.get<Company & { job_roles: JobRole[] }>(`/companies/${companyId}`);
  },

  // Create company (CIR/Admin)
  createCompany: (data: Partial<Company> & { name: string }) => {
    return api.post<Company>('/companies', data);
  },

  // Update company (CIR/Admin)
  updateCompany: (id: string, data: Partial<Company>) => {
    return api.put<Company>(`/companies/${id}`, data);
  },

  // Delete company (CIR/Admin)
  deleteCompany: (id: string) => {
    return api.delete<{ company_id: string }>(`/companies/${id}`);
  },

  // Create job role (CIR/Admin)
  createJobRole: (companyId: string, data: Partial<JobRole> & { title: string }) => {
    // Backend validation requires company_id in body
    const payload = { ...data, company_id: companyId } as any;
    return api.post<JobRole>(`/companies/${companyId}/job-roles`, payload);
  },

  // Update job role (CIR/Admin)
  updateJobRole: (companyId: string, jobRoleId: string, data: Partial<JobRole>) => {
    return api.put<JobRole>(`/companies/${companyId}/job-roles/${jobRoleId}`, data);
  },

  // Delete job role (CIR/Admin)
  deleteJobRole: (companyId: string, jobRoleId: string) => {
    return api.delete<{ job_role_id: string }>(`/companies/${companyId}/job-roles/${jobRoleId}`);
  },

  // Get company candidates (matching)
  getCompanyCandidates: (companyId: string, filters: {
    job_role_id?: string;
    min_cgpa?: number;
    required_skills?: string[];
    required_interests?: string[];
    page?: number;
    limit?: number;
  } = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    return api.get<PaginatedResponse<MatchScore & { student: any }>>(
      `/companies/${companyId}/candidates?${params.toString()}`
    );
  },

  // Suggest a single student (existing endpoint)
  suggestStudent: (companyId: string, data: { student_id: string; job_role_id?: string }) => {
    return api.post(`/companies/${companyId}/invitations`, data);
  },

  // Bulk suggest students (new endpoint)
  bulkSuggestStudents: (
    companyId: string,
    data: { student_ids: string[]; job_role_id?: string }
  ) => {
    return api.post(`/companies/${companyId}/invitations/bulk`, data);
  },
};
