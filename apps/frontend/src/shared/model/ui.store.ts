import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UiState {
  notifications: Notification[];
  notify: (type: Notification['type'], message: string) => void;
  dismissNotification: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  notifications: [],

  notify: (type, message) =>
    set((state) => ({
      notifications: [...state.notifications, { id: crypto.randomUUID(), type, message }],
    })),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    })),
}));
