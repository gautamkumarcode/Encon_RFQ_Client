'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AccessDenied, { GateFallback } from './AccessDenied';

function roleAllowed(userRole: string | undefined, roles: string[]): boolean {
  const r = (userRole || '').toUpperCase();
  return roles.some((x) => String(x).toUpperCase() === r);
}

/**
 * Client-side role gate. Renders `children` only when the logged-in user's role
 * is in `roles`; otherwise shows an access-restricted card. `children` is an
 * unmounted element until allowed, so a guarded page's data hooks won't fire for
 * users without access. (The backend route gate is the real enforcement.)
 */
export default function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return <GateFallback />;

  if (!roleAllowed(user?.role, roles)) {
    return (
      <AccessDenied
        hint={`This section is available only to the ${roles.join(', ')} role${
          roles.length > 1 ? 's' : ''
        }. Your current role${
          user?.role ? ` (${user.role})` : ''
        } does not have access. Contact an administrator if you believe this is a mistake.`}
      />
    );
  }

  return <>{children}</>;
}
