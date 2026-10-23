// ---------------------------------------------------------------------------
// Data hooks for the Clients feature (react-query wrappers).
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { ClientDetailResponse, ClientsResponse } from './types';

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// List clients + per-client roll-up stats.
export function useClients(search: string) {
  const debSearch = useDebouncedValue(search, 350);
  return useQuery<ClientsResponse>({
    queryKey: ['clients', debSearch],
    queryFn: async () => (await api.get('/clients', { params: debSearch ? { search: debSearch } : {} })).data,
  });
}

// One client with its enquiries + orders (detail modal).
export function useClientDetail(id: string | null) {
  return useQuery<ClientDetailResponse>({
    queryKey: ['clientDetail', id],
    queryFn: async () => (await api.get(`/clients/${id}`)).data,
    enabled: !!id,
  });
}

// Create/update (upsert by name) + delete.
export function useClientMutations(onSaved: () => void) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['clientDetail'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post('/clients', payload);
    },
    onSuccess: () => {
      onSaved();
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: invalidate,
  });

  return { saveMutation, deleteMutation };
}
