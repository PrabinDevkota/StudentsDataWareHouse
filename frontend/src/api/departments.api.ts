import apiClient from './axios';

// Define types locally to avoid import issues
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

interface Department {
  department_id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const departmentsApi = {
  // Get all departments
  getDepartments: async (): Promise<ApiResponse<Department[]>> => {
    const response = await apiClient.get('/departments');
    return response.data;
  },

  // Get department by ID
  getDepartmentById: async (id: string): Promise<ApiResponse<Department>> => {
    const response = await apiClient.get(`/departments/${id}`);
    return response.data;
  },

  // Create department (Admin only)
  createDepartment: async (data: Partial<Department>): Promise<ApiResponse<Department>> => {
    const response = await apiClient.post('/departments', data);
    return response.data;
  },

  // Update department (Admin only)
  updateDepartment: async (id: string, data: Partial<Department>): Promise<ApiResponse<Department>> => {
    const response = await apiClient.put(`/departments/${id}`, data);
    return response.data;
  },

  // Delete department (Admin only)
  deleteDepartment: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/departments/${id}`);
    return response.data;
  },
};
