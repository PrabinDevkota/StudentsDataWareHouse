import apiClient from './axios';

// Define types locally to avoid import issues
interface User {
  user_id: string;
  email: string;
  role: 'ADMIN' | 'FACULTY' | 'CIR' | 'CLUB' | 'STUDENT';
  profile_type: 'STUDENT' | 'FACULTY' | 'ADMIN';
  profile_ref_id: string;
  is_active: boolean;
  created_at: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface StudentLoginRequest {
  email: string;
  name: string;
}

interface FacultyLoginRequest {
  email: string;
  name: string;
}

interface ClubLoginRequest {
  club_id: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  role: string;
  profile_type: string;
  profile_ref_id: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

export const authApi = {
  // Login user
  login: (credentials: LoginRequest) => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
  },

  // Student login
  studentLogin: (credentials: StudentLoginRequest) => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/student-login', credentials);
  },

  // Faculty login
  facultyLogin: (credentials: FacultyLoginRequest) => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/faculty-login', credentials);
  },

  // Club login (club_id only)
  clubLogin: (credentials: ClubLoginRequest) => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/club-login', credentials);
  },

  // Register user (Admin only)
  register: (userData: RegisterRequest) => {
    return apiClient.post<ApiResponse<{ user: User }>>('/auth/register', userData);
  },

  // Get current user profile
  getProfile: () => {
    return apiClient.get<ApiResponse<User>>('/auth/me');
  },

  // Change password
  changePassword: (currentPassword: string, newPassword: string) => {
    return apiClient.put<ApiResponse<{ message: string }>>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  // Refresh token
  refreshToken: () => {
    return apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh');
  },

  // Logout
  logout: () => {
    return apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
  },
};
