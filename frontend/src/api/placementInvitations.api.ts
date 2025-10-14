import apiClient from './axios';

export interface PlacementInvitation {
  id: string;
  company_id: string;
  student_id: string;
  job_role_id?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELED';
  created_at: string;
  updated_at: string;
  created_by: string;
  responded_at?: string | null;
  responded_by?: string | null;
  // Optional display details
  company_name?: string;
  job_role_title?: string;
}

export const placementInvitationsApi = {
  createInvitation: async (companyId: string, studentId: string, jobRoleId?: string) => {
    const res = await apiClient.post<PlacementInvitation>(`/companies/${companyId}/invitations`, {
      student_id: studentId,
      job_role_id: jobRoleId,
    });
    return res.data;
  },

  getCompanyInvitations: async (companyId: string) => {
    const res = await apiClient.get<{ success: boolean; data: PlacementInvitation[] }>(`/companies/${companyId}/invitations`);
    return res.data;
  },

  getStudentPlacementInvitations: async (studentId: string) => {
    const res = await apiClient.get<{ success: boolean; data: PlacementInvitation[] }>(`/students/${studentId}/placement-invitations`);
    return res.data;
  },

  respondInvitation: async (inviteId: string, action: 'ACCEPT' | 'DECLINE') => {
    const res = await apiClient.post<{ success: boolean; data: { invite: PlacementInvitation } }>(`/placement-invitations/${inviteId}/respond`, { action });
    return res.data;
  },
  deleteInvitation: async (inviteId: string) => {
    const res = await apiClient.delete<{ success: boolean; data: { id: string } }>(`/placement-invitations/${inviteId}`);
    return res.data;
  },
};