import { create } from 'zustand';
import { api } from '../services/api';

export interface UserState {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string;
  isGuest: boolean;
}

interface AuthStore {
  user: UserState | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password?: string) => Promise<void>;
  register: (username: string, email?: string, password?: string) => Promise<void>;
  createGuest: (displayName: string) => Promise<UserState>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem('syncscreen_token') || null,
  isLoading: true,
  error: null,

  initializeAuth: async () => {
    const token = localStorage.getItem('syncscreen_token');
    const storedUser = localStorage.getItem('syncscreen_user');

    if (storedUser) {
      try {
        set({ user: JSON.parse(storedUser), token, isLoading: false });
      } catch (e) {
        localStorage.removeItem('syncscreen_user');
      }
    }

    if (token) {
      try {
        const data = await api.getMe(token);
        set({ user: data.user, token, isLoading: false });
        localStorage.setItem('syncscreen_user', JSON.stringify(data.user));
      } catch (err) {
        // Token expired or invalid
        localStorage.removeItem('syncscreen_token');
        localStorage.removeItem('syncscreen_user');
        set({ user: null, token: null, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  login: async (username: string, password?: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.login(username, password);
      localStorage.setItem('syncscreen_token', data.token);
      localStorage.setItem('syncscreen_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  register: async (username: string, email?: string, password?: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.register(username, email, password);
      localStorage.setItem('syncscreen_token', data.token);
      localStorage.setItem('syncscreen_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  createGuest: async (displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.createGuest(displayName);
      localStorage.setItem('syncscreen_token', data.token);
      localStorage.setItem('syncscreen_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
      return data.user;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('syncscreen_token');
    localStorage.removeItem('syncscreen_user');
    set({ user: null, token: null });
  },
}));
