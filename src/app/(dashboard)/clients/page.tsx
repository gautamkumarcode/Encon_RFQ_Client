'use client';

import React, { useEffect, useRef, useState } from 'react';
import PageHeader from '../../../components/clients/PageHeader';
import SummaryChips from '../../../components/clients/SummaryChips';
import FilterBar from '../../../components/clients/FilterBar';
import ClientsTable from '../../../components/clients/ClientsTable';
import ClientFormModal from '../../../components/clients/ClientFormModal';
import ClientDetailModal from '../../../components/clients/ClientDetailModal';
import PaginationBar from '../../../components/common/PaginationBar';
import { useClients, useClientMutations } from '../../../components/clients/hooks';
import { emptyClientForm, clientToForm, clientFormToPayload, emptyAddr } from '../../../components/clients/utils';
import type { ClientAddr, ClientFormState, ClientRow } from '../../../components/clients/types';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const tableRef = useRef<HTMLDivElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ClientFormState>(emptyClientForm());
  const [detailId, setDetailId] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isFetching, refetch } = useClients(search);
  const closeForm = () => {
    setFormOpen(false);
    setForm(emptyClientForm());
  };
  const { saveMutation, deleteMutation } = useClientMutations(closeForm);

  const rows = data?.data ?? [];
  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const paged = rows.slice(startIdx, startIdx + pageSize);

  function openNew() {
    setForm(emptyClientForm());
    setFormOpen(true);
  }
  function openEdit(c: ClientRow) {
    setForm(clientToForm(c));
    setFormOpen(true);
  }
  function setField<K extends keyof ClientFormState>(k: K, v: ClientFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function setAddr(i: number, patch: Partial<ClientAddr>) {
    setForm((f) => ({ ...f, addresses: f.addresses.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) }));
  }
  function addAddr() {
    setForm((f) => ({ ...f, addresses: [...f.addresses, emptyAddr()] }));
  }
  function removeAddr(i: number) {
    setForm((f) => ({ ...f, addresses: f.addresses.filter((_, idx) => idx !== i) }));
  }

  function submit() {
    if (!form.name.trim()) return;
    saveMutation.mutate(clientFormToPayload(form));
  }
  function removeClient(c: ClientRow) {
    if (window.confirm(`Delete client "${c.name}"? Their orders remain but lose the master link.`)) deleteMutation.mutate(c.id);
  }

  const changePage = (p: number) => {
    setPage(p);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const changePageSize = (n: number) => {
    setPageSize(n);
    setPage(1);
  };

  return (
    <div className="space-y-6" ref={tableRef}>
      <PageHeader refreshing={isFetching} onRefresh={() => refetch()} onNew={openNew} />
      <SummaryChips rows={rows} />
      <FilterBar search={search} onSearch={setSearch} />
      <ClientsTable
        isLoading={isLoading}
        rows={rows}
        paged={paged}
        startIdx={startIdx}
        totalCount={data?.count ?? 0}
        onView={(c) => setDetailId({ id: c.id, name: c.name })}
        onEdit={openEdit}
        onDelete={removeClient}
      />
      {rows.length > 0 && (
        <PaginationBar page={currentPage} pageSize={pageSize} total={rows.length} onPage={changePage} onPageSize={changePageSize} />
      )}

      {formOpen && (
        <ClientFormModal
          isNew={!form.id}
          form={form}
          saving={saveMutation.isPending}
          setField={setField}
          onAddrChange={setAddr}
          onAddAddr={addAddr}
          onRemoveAddr={removeAddr}
          onSubmit={submit}
          onClose={closeForm}
        />
      )}
      {detailId && <ClientDetailModal id={detailId.id} name={detailId.name} onClose={() => setDetailId(null)} />}
    </div>
  );
}
