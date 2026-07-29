import type { Location } from 'react-router-dom';

/** Resolves where to send the user after auth, based on the `{ from: Location }` state
 * left by ProtectedRoute or a manual "you need to log in" link. */
export function resolveRedirectPath(state: unknown, fallback = '/'): string {
  const from = (state as { from?: Location } | null)?.from;
  if (!from) {
    return fallback;
  }
  return `${from.pathname}${from.search}${from.hash}`;
}
