const getApiBaseUrl = () => {
  const raw = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;
};

export async function fetchServerEnquiries(
  cookieHeader: string,
  searchParams: {
    tab?: string;
    search?: string;
    status?: string;
    assignedTo?: string;
    page?: string;
    limit?: string;
  }
) {
  try {
    const query = new URLSearchParams();
    if (searchParams.tab) query.set('tab', searchParams.tab);
    if (searchParams.search) query.set('search', searchParams.search);
    if (searchParams.status) query.set('status', searchParams.status);
    if (searchParams.assignedTo) query.set('assignedTo', searchParams.assignedTo);
    if (searchParams.page) query.set('page', searchParams.page);
    if (searchParams.limit) query.set('limit', searchParams.limit);

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/rfq?${query.toString()}`, {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[SSR RFQ] Server fetch exception:', err);
    return null;
  }
}
