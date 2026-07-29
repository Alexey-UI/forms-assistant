import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/providers/router';
import { useAuthStore } from '@/entities/auth/model/auth.store';

export function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  return <RouterProvider router={router} />;
}
