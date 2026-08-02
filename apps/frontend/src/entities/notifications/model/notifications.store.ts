import { create } from 'zustand';
import type { NotificationDto } from '@forms-assistant/shared';
import { api } from '@/shared/api/client';
import { getSocket } from '@/entities/chat/model/socket';

interface NotificationsState {
  notifications: NotificationDto[];
  unreadCount: number;
  connected: boolean;

  connect: () => void;
  disconnect: () => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  connected: false,

  connect: () => {
    if (get().connected) return;
    const socket = getSocket();
    if (!socket) return;

    socket.on('notification:new', (notification: NotificationDto) => {
      set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 50),
        unreadCount: state.unreadCount + 1,
      }));
    });

    set({ connected: true });
    void get().fetchNotifications();
    void get().fetchUnreadCount();
  },

  disconnect: () => {
    set({ connected: false, notifications: [], unreadCount: 0 });
  },

  fetchNotifications: async () => {
    const notifications = await api.get<NotificationDto[]>('/notifications');
    set({ notifications });
  },

  fetchUnreadCount: async () => {
    const { count } = await api.get<{ count: number }>('/notifications/unread-count');
    set({ unreadCount: count });
  },

  markRead: async (id) => {
    await api.post(`/notifications/${id}/read`);
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await api.post('/notifications/read-all');
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
      unreadCount: 0,
    }));
  },
}));
