import apiClient from './axios';
import type { Student, StudentFilters, PaginatedResponse } from '../types/student.types';
import type { StudentWithDetails } from '../types/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

// Payload types aligned with backend validation schemas
interface StudentCreatePayload {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  dob?: string; // ISO date (yyyy-mm-dd)
  gender?: 'Male' | 'Female' | 'Other';
  department_id: string; // UUID
  semester: number;
  cgpa?: number | null;
  attendance_percentage?: number | null;
  research_experience?: boolean;
}

interface StudentUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  dob?: string; // ISO date (yyyy-mm-dd)
  gender?: 'Male' | 'Female' | 'Other';
  department_id?: string; // UUID
  semester?: number;
  cgpa?: number | null;
  attendance_percentage?: number | null;
  research_experience?: boolean;
  skills?: string[];
  interests?: string[];
}

export const studentsApi = {
  // Get all students with filters and pagination
  getStudents: (filters: StudentFilters = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const url = `/students?${params.toString()}`;
    console.log('API Call Debug:', {
      filters: JSON.stringify(filters),
      url,
      paramsString: params.toString(),
      hasQuery: !!filters.q
    });

    return apiClient.get<ApiResponse<PaginatedResponse<Student>>>(url)
      .then(response => {
        console.log('API Response Debug:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          success: response.data?.success,
          studentsCount: response.data?.data?.students?.length || 0,
          fullResponse: JSON.stringify(response.data, null, 2)
        });
        return response;
      })
      .catch(error => {
        console.error('API Error Debug:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          fullError: error
        });
        throw error;
      });
  },

  // Get student by ID with full details
  getStudentById: (id: string) => {
    return apiClient.get<ApiResponse<StudentWithDetails>>(`/students/${id}`);
  },

  // Create new student
  createStudent: (studentData: StudentCreatePayload) => {
    return apiClient.post<ApiResponse<any>>('/students', studentData);
  },

  // Update student
  updateStudent: (id: string, studentData: StudentUpdatePayload) => {
    return apiClient.put<ApiResponse<any>>(`/students/${id}`, studentData);
  },

  // Delete student
  deleteStudent: (id: string) => {
    return apiClient.delete<ApiResponse<{ student_id: string }>>(`/students/${id}`);
  },

  // Bulk import students via Excel
  importStudents: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse<{ processed: number; inserted: number; skipped_duplicate: number; skipped_invalid: number; errors: string[] }>>(
      '/students/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  // Upload student avatar
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return apiClient.post<ApiResponse<{
      student_id: string;
      avatar_path: string;
      file_info: {
        original_name: string;
        filename: string;
        size: number;
        mimetype: string;
      };
    }>>(`/students/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get student skills
  getStudentSkills: (id: string) => {
    return apiClient.get<ApiResponse<Student['skills']>>(`/students/${id}/skills`);
  },

  // Get student interests
  getStudentInterests: (id: string) => {
    return apiClient.get<ApiResponse<Student['interests']>>(`/students/${id}/interests`);
  },

  // Add skill to student
  addSkill: (id: string, skillId: string, proficiencyLevel: string = 'INTERMEDIATE') => {
    return apiClient.post(`/students/${id}/skills`, {
      skill_id: skillId,
      proficiency_level: proficiencyLevel,
      student_description: undefined,
    });
  },

  // Remove skill from student
  removeSkill: (id: string, skillId: string) => {
    return apiClient.delete(`/students/${id}/skills/${skillId}`);
  },

  // Add interest to student
  addInterest: (id: string, interestId: string) => {
    return apiClient.post(`/students/${id}/interests`, {
      interest_id: interestId,
      student_description: undefined,
    });
  },

  // Remove interest from student
  removeInterest: (id: string, interestId: string) => {
    return apiClient.delete(`/students/${id}/interests/${interestId}`);
  },
};
