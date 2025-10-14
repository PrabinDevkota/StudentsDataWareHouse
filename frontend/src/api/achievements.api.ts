import apiClient from './axios';

export interface Achievement {
  achievement_id: string;
  title: string;
  description?: string | null;
  achievement_date?: string | null;
  category?: string | null;
  is_verified?: boolean;
}

export interface NewAchievementData {
  title: string;
  description?: string | null;
  achievement_date?: string | null;
  category?: string | null;
}

export const studentAchievementsApi = {
  getStudentAchievements: async (studentId: string) => {
    const res = await apiClient.get(`/students/${studentId}/achievements`);
    return res.data;
  },

  addAchievementToStudent: async (studentId: string, data: NewAchievementData) => {
    const res = await apiClient.post(`/students/${studentId}/achievements`, data);
    return res.data;
  },

  removeAchievementFromStudent: async (studentId: string, achievementId: string) => {
    const res = await apiClient.delete(`/students/${studentId}/achievements/${achievementId}`);
    return res.data;
  },
};