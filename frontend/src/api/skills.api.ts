import apiClient from './axios';

export interface Skill {
  skill_id: string;
  name: string;
  category: string;
  student_count?: number;
  created_at: string;
}

// Student skill with proficiency level (for student-specific skill data)
export interface StudentSkill extends Skill {
  proficiency_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  acquired_date?: string;
  student_description?: string;
}

export interface Interest {
  interest_id: string;
  name: string;
  category: string;
  student_count?: number;
  // Student-specific description returned when fetching a student's interests
  student_description?: string;
  created_at: string;
}

export interface SkillsResponse {
  success: boolean;
  skills?: Skill[];
  data?: Skill[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InterestsResponse {
  success: boolean;
  interests?: Interest[];
  data?: Interest[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const skillsApi = {
  // Get all skills
  getSkills: async (params?: { page?: number; limit?: number }): Promise<SkillsResponse> => {
    const response = await apiClient.get('/skills', { params });
    return response.data;
  },

  // Search skills by name
  searchSkills: async (query: string): Promise<SkillsResponse> => {
    const response = await apiClient.get('/skills/search', { params: { q: query } });
    return response.data;
  },

  // Create new skill (admin only)
  createSkill: async (skillData: { name: string; category?: string }): Promise<{ success: boolean; skill: Skill }> => {
    const response = await apiClient.post('/skills', skillData);
    return response.data;
  },

  // Update skill (admin only)
  updateSkill: async (skillId: string, skillData: { name: string; category?: string }): Promise<{ success: boolean; skill: Skill }> => {
    const response = await apiClient.put(`/skills/${skillId}`, skillData);
    return response.data;
  },

  // Delete skill (admin only)
  deleteSkill: async (skillId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/skills/${skillId}`);
    return response.data;
  }
};

export const interestsApi = {
  // Get all interests
  getInterests: async (params?: { page?: number; limit?: number }): Promise<InterestsResponse> => {
    const response = await apiClient.get('/interests', { params });
    return response.data;
  },

  // Search interests by name
  searchInterests: async (query: string): Promise<InterestsResponse> => {
    const response = await apiClient.get('/interests/search', { params: { q: query } });
    return response.data;
  },

  // Create new interest (admin only)
  createInterest: async (interestData: { name: string; category?: string }): Promise<{ success: boolean; interest: Interest }> => {
    const response = await apiClient.post('/interests', interestData);
    return response.data;
  },

  // Update interest (admin only)
  updateInterest: async (interestId: string, interestData: { name: string; category?: string }): Promise<{ success: boolean; interest: Interest }> => {
    const response = await apiClient.put(`/interests/${interestId}`, interestData);
    return response.data;
  },

  // Delete interest (admin only)
  deleteInterest: async (interestId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/interests/${interestId}`);
    return response.data;
  }
};

// Student Skills and Interests Management API
export interface StudentSkillData {
  skill_id: string;
  proficiency_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  student_description?: string;
}

export interface NewSkillData {
  name: string;
  category?: string;
  proficiency_level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  student_description?: string;
}

export interface StudentInterestData {
  interest_id: string;
  student_description?: string;
}

export interface NewInterestData {
  name: string;
  category?: string;
  student_description?: string;
}

export const studentSkillsApi = {
  // Get student's skills
  getStudentSkills: async (studentId: string): Promise<{ success: boolean; data: StudentSkill[] }> => {
    const response = await apiClient.get(`/students/${studentId}/skills`);
    return response.data;
  },

  // Add existing skill to student
  addSkillToStudent: async (studentId: string, skillData: StudentSkillData): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await apiClient.post(`/students/${studentId}/skills`, skillData);
    return response.data;
  },

  // Add new skill to student (creates skill if it doesn't exist)
  addNewSkillToStudent: async (studentId: string, skillData: NewSkillData): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await apiClient.post(`/students/${studentId}/skills/new`, skillData);
    return response.data;
  },

  // Remove skill from student
  removeSkillFromStudent: async (studentId: string, skillId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/students/${studentId}/skills/${skillId}`);
    return response.data;
  }
};

export const studentInterestsApi = {
  // Get student's interests
  getStudentInterests: async (studentId: string): Promise<{ success: boolean; data: Interest[] }> => {
    const response = await apiClient.get(`/students/${studentId}/interests`);
    return response.data;
  },

  // Add existing interest to student
  addInterestToStudent: async (studentId: string, interestData: StudentInterestData): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await apiClient.post(`/students/${studentId}/interests`, interestData);
    return response.data;
  },

  // Add new interest to student (creates interest if it doesn't exist)
  addNewInterestToStudent: async (studentId: string, interestData: NewInterestData): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await apiClient.post(`/students/${studentId}/interests/new`, interestData);
    return response.data;
  },

  // Remove interest from student
  removeInterestFromStudent: async (studentId: string, interestId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/students/${studentId}/interests/${interestId}`);
    return response.data;
  }
};