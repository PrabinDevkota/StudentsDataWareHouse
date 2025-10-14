import apiClient from './axios';

// Define types locally to avoid import issues
interface Faculty {
  faculty_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id: string;
  department_name?: string;
  department_code?: string;
  designation?: string;
  specialization?: string;
  avatar_path?: string;
  created_at: string;
  updated_at: string;
}

interface FacultyWithDetails extends Faculty {
  research_projects?: any[];
  department?: {
    department_id: string;
    name: string;
    code: string;
    description?: string;
  };
}

interface FacultyFilters {
  q?: string;
  department_id?: string;
  designation?: string;
  specialization?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

// Response shape from backend for list endpoint: { success, data: Faculty[], meta }
interface FacultyListResponse {
  success: boolean;
  data: Faculty[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
  error?: string;
  code?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

export const facultyApi = {
  // Get all faculty with filters and pagination
  getFaculty: (filters: FacultyFilters = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    // Backend returns: { success, data: Faculty[], meta }
    return apiClient.get<FacultyListResponse>(`/faculty?${params.toString()}`);
  },

  // Get faculty by ID with full details
  getFacultyById: (id: string) => {
    return apiClient.get<ApiResponse<FacultyWithDetails>>(`/faculty/${id}`);
  },

  // Create new faculty
  createFaculty: (facultyData: Partial<Faculty>) => {
    return apiClient.post<ApiResponse<Faculty>>('/faculty', facultyData);
  },

  // Update faculty
  updateFaculty: (id: string, facultyData: Partial<Faculty>) => {
    return apiClient.put<ApiResponse<Faculty>>(`/faculty/${id}`, facultyData);
  },

  // Delete faculty
  deleteFaculty: (id: string) => {
    return apiClient.delete<ApiResponse<{ faculty_id: string }>>(`/faculty/${id}`);
  },

  // Bulk import faculty via Excel
  importFaculty: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse<{ processed: number; inserted: number; skipped_duplicate: number; skipped_invalid: number; errors: string[] }>>(
      '/faculty/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  // Upload faculty avatar
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return apiClient.post<ApiResponse<{
      faculty_id: string;
      avatar_path: string;
      file_info: {
        original_name: string;
        filename: string;
        size: number;
        mimetype: string;
      };
    }>>(`/faculty/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};