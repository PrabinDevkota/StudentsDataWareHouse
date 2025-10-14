export interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: string;
  department_name: string;
  department_code: string;
  semester: number;
  cgpa: string | null;
  research_experience: boolean;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
  skills?: any[];
  interests?: any[];
}

export interface StudentFilters {
  q?: string;
  student_id?: string;
  skills?: string;
  interests?: string;
  min_cgpa?: number;
  max_cgpa?: number;
  department_id?: string;
  semester?: number;
  research_experience?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  students: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}