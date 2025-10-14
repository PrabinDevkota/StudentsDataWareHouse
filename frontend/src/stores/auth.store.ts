import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (authData: AuthResponse) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // Start with loading true to prevent flash

      // Actions
      setAuth: (authData: AuthResponse) => {
        set({
          user: authData.user,
          accessToken: authData.access_token,
          refreshToken: authData.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      logout: () => {
        // Clear tokens from localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // After rehydration, set the correct authentication state
          if (state.user && state.accessToken) {
            state.isAuthenticated = true;
            state.isLoading = false;
          } else {
            state.isAuthenticated = false;
            state.isLoading = false;
          }
        }
      },
    }
  )
);

// Selectors - use individual selectors to avoid object recreation
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);

// Individual action selectors to avoid object recreation
export const useSetAuth = () => useAuthStore((state) => state.setAuth);
export const useSetUser = () => useAuthStore((state) => state.setUser);
export const useSetLoading = () => useAuthStore((state) => state.setLoading);
export const useLogout = () => useAuthStore((state) => state.logout);
export const useClearAuth = () => useAuthStore((state) => state.clearAuth);
