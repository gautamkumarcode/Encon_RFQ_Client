const getApiBaseUrl = () => {
  const raw = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;
};

export async function fetchServerDashboardSummary(cookieHeader: string) {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/dashboard/summary`, {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`[SSR Dashboard] Server fetch returned HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('[SSR Dashboard] Server fetch exception:', err);
    return null;
  }
}
