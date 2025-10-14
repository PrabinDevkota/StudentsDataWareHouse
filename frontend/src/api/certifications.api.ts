import apiClient from './axios';

export interface Certification {
  certification_id: string;
  name: string;
  issuing_organization: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
  is_verified?: boolean;
}

export interface NewCertificationData {
  name: string;
  issuing_organization: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
}

export const studentCertificationsApi = {
  getStudentCertifications: async (studentId: string) => {
    const res = await apiClient.get(`/students/${studentId}/certifications`);
    return res.data;
  },

  addCertificationToStudent: async (studentId: string, data: NewCertificationData) => {
    const res = await apiClient.post(`/students/${studentId}/certifications`, data);
    return res.data;
  },

  removeCertificationFromStudent: async (studentId: string, certificationId: string) => {
    const res = await apiClient.delete(`/students/${studentId}/certifications/${certificationId}`);
    return res.data;
  },
};