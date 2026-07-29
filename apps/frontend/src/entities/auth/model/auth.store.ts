import { create } from 'zustand';
import type { UserDto } from '@forms-assistant/shared';
import { env } from '@/shared/config/env';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  status: AuthStatus;
  setSession: (user: UserDto, accessToken: string) => void;
  clearSession: () => void;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'idle',

  setSession: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),

  clearSession: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),

  initAuth: async () => {
    set({ status: 'loading' });
    try {
      const response = await fetch(`${env.apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        set({ user: null, accessToken: null, status: 'unauthenticated' });
        return;
      }
      const data = (await response.json()) as { user: UserDto; accessToken: string };
      set({ user: data.user, accessToken: data.accessToken, status: 'authenticated' });
    } catch {
      set({ user: null, accessToken: null, status: 'unauthenticated' });
    }
  },

  logout: async () => {
    try {
      await fetch(`${env.apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      set({ user: null, accessToken: null, status: 'unauthenticated' });
    }
  },
}));
