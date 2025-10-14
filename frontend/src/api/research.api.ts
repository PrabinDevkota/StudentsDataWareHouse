import apiClient from './axios';

// Request/response types (kept minimal and local)
export interface CreateResearchProjectRequest {
  title: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  faculty_id: string;
  required_skill_ids?: string[];
}

export interface ResearchProject {
  project_id: string;
  title: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  faculty_id: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AddParticipantRequest {
  student_id: string;
  role?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export const researchApi = {
  getProjectById: async (projectId: string) => {
    const res = await apiClient.get(`/research/projects/${projectId}`);
    return res.data;
  },
  createProject: async (data: CreateResearchProjectRequest) => {
    const res = await apiClient.post('/research/projects', data);
    return res.data;
  },

  addParticipant: async (projectId: string, data: AddParticipantRequest) => {
    const res = await apiClient.post(`/research/projects/${projectId}/participants`, data);
    return res.data;
  },
};