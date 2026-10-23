// ---------------------------------------------------------------------------
// Data hooks for the Order in Hand feature (react-query wrappers).
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { ClientsResponse, EnqLite, OrdersResponse, PrefillData } from './types';

// Debounce a rapidly-changing value (used for the search box).
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Paged/filtered list of orders + summary totals.
export function useOrders(search: string, status: string) {
  const debSearch = useDebouncedValue(search, 350);
  return useQuery<OrdersResponse>({
    queryKey: ['orders', debSearch, status],
    queryFn: async () =>
      (
        await api.get('/orders', {
          params: { ...(debSearch ? { search: debSearch } : {}), ...(status ? { status } : {}) },
        })
      ).data,
    placeholderData: keepPreviousData,
  });
}

// Client master for the name picker / datalist.
export function useClients() {
  return useQuery<ClientsResponse>({
    queryKey: ['clients', 'picker'],
    queryFn: async () => (await api.get('/clients')).data,
  });
}

// PO-Received enquiries for the "import from enquiry" handoff. The /rfq list is
// paginated (default 10, newest-first), so we must filter server-side by status
// and raise the limit — otherwise PO-Received rows never reach the client filter.
export function usePoEnquiries() {
  return useQuery<EnqLite[]>({
    queryKey: ['orders', 'poEnquiries'],
    queryFn: async () => {
      const r = await api.get('/rfq', { params: { status: 'PO Received', limit: 100 } });
      const list: any[] = Array.isArray(r.data?.data) ? r.data.data : [];
      return list.map((e): EnqLite => ({
        id: String(e._id || e.id),
        rfqId: e.rfqId || '',
        companyName: e.companyName || '',
        itemDescription: e.itemDescription || '',
      }));
    },
  });
}

// Prefill payload for importing an enquiry into a new order.
export async function fetchEnquiryPrefill(enquiryId: string): Promise<PrefillData> {
  const r = await api.get(`/orders/prefill/${enquiryId}`);
  return r.data.data;
}

// Create + update + delete mutations, invalidating orders/clients on success.
export function useOrderMutations(onSaved: () => void) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string | null; payload: any }) => {
      if (id) await api.put(`/orders/${id}`, payload);
      else await api.post('/orders', payload);
    },
    onSuccess: () => {
      onSaved();
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/orders/${id}`);
    },
    onSuccess: invalidate,
  });

  return { saveMutation, deleteMutation };
}
