import apiClient from './axios';
import type { ApiResponse, Club } from '../types/api';

export interface CreateClubRequest {
  name: string;
  description?: string;
  category?: string;
  established_date?: string; // ISO date string
}

export const clubsApi = {
  // Get all clubs
  getClubs: () => {
    return apiClient.get<ApiResponse<Club[]>>('/clubs');
  },

  // Get club by ID
  getClubById: (id: string) => {
    return apiClient.get<ApiResponse<Club>>(`/clubs/${id}`);
  },

  // Create new club (Admin only)
  createClub: (data: CreateClubRequest) => {
    return apiClient.post<ApiResponse<Club>>('/clubs', data);
  },

  // Delete club (Admin only)
  deleteClub: (id: string) => {
    return apiClient.delete<ApiResponse<{ club_id: string }>>(`/clubs/${id}`);
  },

  // Remove member from club (Club role)
  removeMember: (clubId: string, studentId: string) => {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/clubs/${clubId}/members/${studentId}`);
  },
};