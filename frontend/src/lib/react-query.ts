import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          if (error?.response?.status === 408 || error?.response?.status === 429) {
            return failureCount < 3;
          }
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Query keys factory
export const queryKeys = {
  // Students
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.students.lists(), filters] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
    skills: (id: string) => [...queryKeys.students.detail(id), 'skills'] as const,
    interests: (id: string) => [...queryKeys.students.detail(id), 'interests'] as const,
  },

  // Placements
  placements: {
    all: ['placements'] as const,
    lists: () => [...queryKeys.placements.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.placements.lists(), filters] as const,
    details: () => [...queryKeys.placements.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.placements.details(), id] as const,
    stats: () => [...queryKeys.placements.all, 'stats'] as const,
  },

  // Companies
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.companies.lists(), filters] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.companies.details(), id] as const,
    jobRoles: (id: string) => [...queryKeys.companies.detail(id), 'job-roles'] as const,
    candidates: (id: string, filters: any) => [...queryKeys.companies.detail(id), 'candidates', filters] as const,
  },

  // Auth
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },

  // Skills & Interests
  skills: {
    all: ['skills'] as const,
    lists: () => [...queryKeys.skills.all, 'list'] as const,
  },

  interests: {
    all: ['interests'] as const,
    lists: () => [...queryKeys.interests.all, 'list'] as const,
  },

  // Departments
  departments: {
    all: ['departments'] as const,
    lists: () => [...queryKeys.departments.all, 'list'] as const,
  },

  // Clubs
  clubs: {
    all: ['clubs'] as const,
    lists: () => [...queryKeys.clubs.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.clubs.lists(), filters] as const,
    details: () => [...queryKeys.clubs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clubs.details(), id] as const,
  },
};
