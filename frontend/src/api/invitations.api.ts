import apiClient from './axios';
import type { ApiResponse } from '../types/api';

export interface Invitation {
  id: string;
  club_id: string;
  student_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELED';
  created_at: string;
  updated_at: string;
  role?: string;
  // Optional club details for student views
  club_name?: string;
  club_description?: string;
  club_category?: string;
}

export const invitationsApi = {
  createInvitation: async (clubId: string, studentId: string, role?: string) => {
    const res = await apiClient.post<ApiResponse<Invitation>>(`/clubs/${clubId}/invitations`, { student_id: studentId, role });
    return res.data;
  },

  getClubInvitations: async (clubId: string) => {
    const res = await apiClient.get<ApiResponse<Invitation[]>>(`/clubs/${clubId}/invitations`);
    return res.data;
  },

  getStudentInvitations: async (studentId: string) => {
    const res = await apiClient.get<ApiResponse<Invitation[]>>(`/students/${studentId}/invitations`);
    return res.data;
  },

  respondInvitation: async (inviteId: string, action: 'ACCEPT' | 'DECLINE') => {
    const res = await apiClient.post<ApiResponse<{ invite: Invitation }>>(`/invitations/${inviteId}/respond`, { action });
    return res.data;
  },
  deleteInvitation: async (inviteId: string) => {
    const res = await apiClient.delete<ApiResponse<{ id: string }>>(`/invitations/${inviteId}`);
    return res.data;
  },
};