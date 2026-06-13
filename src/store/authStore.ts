import { create } from 'zustand';
import { api } from '../lib/api';
import type { User } from '../types';

const TOKEN_KEY = 'memorize_token';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (args: { username?: string; email?: string; newPassword?: string; currentPassword?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, token: null, isLoading: false, isInitialized: false, error: null,

  clearError: () => set({ error: null }),

  updateUser: async (args) => {
    const { token } = get();
    if (!token) throw new Error('Not authenticated');
    set({ isLoading: true, error: null });
    try {
      const user = await api.auth.updateUser({ token, ...args });
      set({ user, isLoading: false });
    } catch (err) {
      set({ error: String(err).replace('Error: ', ''), isLoading: false });
      throw err;
    }
  },

  initialize: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { set({ isInitialized: true }); return; }
    try {
      const user = await api.auth.getCurrentUser({ token });
      set({ user, token, isInitialized: true });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ isInitialized: true });
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await api.auth.register({ username, email, password });
      localStorage.setItem(TOKEN_KEY, token);
      set({ user, token, isLoading: false });
    } catch (err) {
      set({ error: String(err).replace('Error: ', ''), isLoading: false });
      throw err;
    }
  },

  login: async (usernameOrEmail, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await api.auth.login({ usernameOrEmail, password });
      localStorage.setItem(TOKEN_KEY, token);
      set({ user, token, isLoading: false });
    } catch (err) {
      set({ error: String(err).replace('Error: ', ''), isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const { token } = get();
    if (token) {
      try { await api.auth.logout({ token }); } catch { /* best-effort */ }
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ user: null, token: null });
  },
}));
