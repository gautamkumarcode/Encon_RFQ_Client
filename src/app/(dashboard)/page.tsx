import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { fetchServerDashboardSummary } from '@/services/serverDashboardService';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const revalidate = 0;

export default async function DashboardPage() {
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();
  const initialData = await fetchServerDashboardSummary(cookieHeader);

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-thermal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Loading Encon Live Dashboard Metrics...</p>
        </div>
      }
    >
      <DashboardClient initialData={initialData} />
    </Suspense>
  );
}
