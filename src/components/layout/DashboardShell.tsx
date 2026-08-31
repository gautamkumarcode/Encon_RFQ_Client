'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="h-screen bg-obsidian-900 flex flex-col overflow-hidden">
        <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
          <main className="flex-1 p-3 md:p-4 overflow-y-auto h-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
