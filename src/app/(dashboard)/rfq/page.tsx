import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { fetchServerEnquiries } from '@/services/serverRfqService';
import RfqTrackerClient from '@/components/rfq/RfqTrackerClient';

export const revalidate = 0;

interface PageProps {
  searchParams: {
    tab?: string;
    search?: string;
    status?: string;
    assignedTo?: string;
    page?: string;
  };
}

export default async function RFQPage({ searchParams }: PageProps) {
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();

  const initialData = await fetchServerEnquiries(cookieHeader, searchParams);

  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold">Loading ENCON RFQ Command Center...</p>
        </div>
      }
    >
      <RfqTrackerClient initialData={initialData} />
    </Suspense>
  );
}
