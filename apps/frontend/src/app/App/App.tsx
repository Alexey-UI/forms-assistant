import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/providers/router';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { useChatStore } from '@/entities/chat/model/chat.store';

export function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const status = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id);
  const connectChat = useChatStore((state) => state.connect);
  const disconnectChat = useChatStore((state) => state.disconnect);
  const loadUnreadSummary = useChatStore((state) => state.loadUnreadSummary);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (status === 'authenticated' && userId) {
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) {
        connectChat(accessToken, userId);
        void loadUnreadSummary();
      }
    } else if (status === 'unauthenticated') {
      disconnectChat();
    }
  }, [status, userId, connectChat, disconnectChat, loadUnreadSummary]);

  return <RouterProvider router={router} />;
}
