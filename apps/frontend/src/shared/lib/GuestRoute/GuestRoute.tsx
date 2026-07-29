import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { resolveRedirectPath } from '@/shared/lib/redirect';

/** Keeps already-authenticated users off /login and /register. */
export function GuestRoute() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'authenticated') {
    return <Navigate to={resolveRedirectPath(location.state)} replace />;
  }

  return <Outlet />;
}
