import { create } from 'zustand';
import type { GroupMessageDto, GroupUnreadSummaryDto } from '@forms-assistant/shared';
import { api } from '@/shared/api/client';
import { connectSocket, disconnectSocket, getSocket } from './socket';

interface ChatState {
  connected: boolean;
  activeGroupId: string | null;
  messagesByGroup: Record<string, GroupMessageDto[]>;
  nextCursorByGroup: Record<string, string | null>;
  loadingByGroup: Record<string, boolean>;
  unreadByGroup: Record<string, number>;

  connect: (accessToken: string, currentUserId: string) => void;
  disconnect: () => void;
  setActiveGroup: (groupId: string | null) => void;
  loadUnreadSummary: () => Promise<void>;
  loadMessages: (groupId: string) => Promise<void>;
  loadMoreMessages: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, text: string) => Promise<void>;
  editMessage: (groupId: string, messageId: string, text: string) => Promise<void>;
  deleteMessage: (groupId: string, messageId: string) => Promise<void>;
  markRead: (groupId: string) => Promise<void>;
}

function mergeMessage(list: GroupMessageDto[], message: GroupMessageDto): GroupMessageDto[] {
  if (list.some((existing) => existing.id === message.id)) {
    return list;
  }
  return [...list, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export const useChatStore = create<ChatState>((set, get) => ({
  connected: false,
  activeGroupId: null,
  messagesByGroup: {},
  nextCursorByGroup: {},
  loadingByGroup: {},
  unreadByGroup: {},

  connect: (accessToken, currentUserId) => {
    const socket = connectSocket(accessToken);

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('message:new', (message: GroupMessageDto) => {
      set((state) => {
        const isActive = state.activeGroupId === message.groupId;
        const isOwn = message.author.id === currentUserId;
        return {
          messagesByGroup: {
            ...state.messagesByGroup,
            [message.groupId]: mergeMessage(state.messagesByGroup[message.groupId] ?? [], message),
          },
          unreadByGroup:
            isActive || isOwn
              ? state.unreadByGroup
              : {
                  ...state.unreadByGroup,
                  [message.groupId]: (state.unreadByGroup[message.groupId] ?? 0) + 1,
                },
        };
      });
    });

    socket.on('message:updated', (message: GroupMessageDto) => {
      set((state) => ({
        messagesByGroup: {
          ...state.messagesByGroup,
          [message.groupId]: (state.messagesByGroup[message.groupId] ?? []).map((existing) =>
            existing.id === message.id ? message : existing,
          ),
        },
      }));
    });

    socket.on(
      'message:deleted',
      ({ groupId, messageId }: { groupId: string; messageId: string }) => {
        set((state) => ({
          messagesByGroup: {
            ...state.messagesByGroup,
            [groupId]: (state.messagesByGroup[groupId] ?? []).filter(
              (message) => message.id !== messageId,
            ),
          },
        }));
      },
    );
  },

  disconnect: () => {
    disconnectSocket();
    set({ connected: false, messagesByGroup: {}, nextCursorByGroup: {}, unreadByGroup: {} });
  },

  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

  loadUnreadSummary: async () => {
    const summary = await api.get<GroupUnreadSummaryDto[]>('/groups/unread-summary');
    set({
      unreadByGroup: Object.fromEntries(summary.map((entry) => [entry.groupId, entry.unreadCount])),
    });
  },

  loadMessages: async (groupId) => {
    set((state) => ({ loadingByGroup: { ...state.loadingByGroup, [groupId]: true } }));
    try {
      const page = await api.get<{ messages: GroupMessageDto[]; nextCursor: string | null }>(
        `/groups/${groupId}/messages`,
      );
      set((state) => ({
        messagesByGroup: { ...state.messagesByGroup, [groupId]: page.messages },
        nextCursorByGroup: { ...state.nextCursorByGroup, [groupId]: page.nextCursor },
      }));
    } finally {
      set((state) => ({ loadingByGroup: { ...state.loadingByGroup, [groupId]: false } }));
    }
  },

  loadMoreMessages: async (groupId) => {
    const cursor = get().nextCursorByGroup[groupId];
    if (!cursor || get().loadingByGroup[groupId]) {
      return;
    }
    set((state) => ({ loadingByGroup: { ...state.loadingByGroup, [groupId]: true } }));
    try {
      const page = await api.get<{ messages: GroupMessageDto[]; nextCursor: string | null }>(
        `/groups/${groupId}/messages?before=${cursor}`,
      );
      set((state) => ({
        messagesByGroup: {
          ...state.messagesByGroup,
          [groupId]: [...page.messages, ...(state.messagesByGroup[groupId] ?? [])],
        },
        nextCursorByGroup: { ...state.nextCursorByGroup, [groupId]: page.nextCursor },
      }));
    } finally {
      set((state) => ({ loadingByGroup: { ...state.loadingByGroup, [groupId]: false } }));
    }
  },

  sendMessage: async (groupId, text) => {
    const message = await api.post<GroupMessageDto>(`/groups/${groupId}/messages`, { text });
    set((state) => ({
      messagesByGroup: {
        ...state.messagesByGroup,
        [groupId]: mergeMessage(state.messagesByGroup[groupId] ?? [], message),
      },
    }));
  },

  editMessage: async (groupId, messageId, text) => {
    const message = await api.patch<GroupMessageDto>(`/groups/${groupId}/messages/${messageId}`, {
      text,
    });
    set((state) => ({
      messagesByGroup: {
        ...state.messagesByGroup,
        [groupId]: (state.messagesByGroup[groupId] ?? []).map((existing) =>
          existing.id === message.id ? message : existing,
        ),
      },
    }));
  },

  deleteMessage: async (groupId, messageId) => {
    await api.delete(`/groups/${groupId}/messages/${messageId}`);
    set((state) => ({
      messagesByGroup: {
        ...state.messagesByGroup,
        [groupId]: (state.messagesByGroup[groupId] ?? []).filter(
          (message) => message.id !== messageId,
        ),
      },
    }));
  },

  markRead: async (groupId) => {
    await api.post(`/groups/${groupId}/read`);
    set((state) => ({ unreadByGroup: { ...state.unreadByGroup, [groupId]: 0 } }));
  },
}));

export function isSocketConnected(): boolean {
  return getSocket()?.connected ?? false;
}
