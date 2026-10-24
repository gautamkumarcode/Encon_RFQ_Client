'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AccessDenied, { GateFallback } from './AccessDenied';

/**
 * Capability gate — the frontend counterpart of the backend requirePermission
 * middleware. Checks the role/permission matrix the admin maintains on the Roles
 * page, so what the UI offers and what the API allows come from the SAME source.
 *
 * `children` stays an unmounted element until the check passes, so a guarded
 * page's data hooks never fire for a user who lacks the capability.
 */
export default function RequirePermission({
  module,
  action = 'READ',
  children,
}: {
  module: string;
  action?: string;
  children: React.ReactNode;
}) {
  const { user, loading, hasPermission } = useAuth();

  if (loading) return <GateFallback />;

  if (!hasPermission(module, action)) {
    return (
      <AccessDenied
        hint={`This area needs the ${module}:${action} capability. Your role${
          user?.role ? ` (${user.role})` : ''
        } has not been granted it — an administrator can tick it under Role & Permissions.`}
      />
    );
  }

  return <>{children}</>;
}
