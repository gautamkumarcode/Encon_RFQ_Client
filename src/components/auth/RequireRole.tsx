'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-thermal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!roleAllowed(user?.role, roles)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-16 text-center">
        <ShieldAlert className="w-8 h-8 text-amber-500" />
        <h2 className="text-sm font-bold text-slate-200">Access restricted</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          This section is available only to the {roles.join(', ')} role
          {roles.length > 1 ? 's' : ''}. Your current role
          {user?.role ? ` (${user.role})` : ''} does not have access. Contact an
          administrator if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
