'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../../../components/order-in-hand/PageHeader';
import SummaryChips from '../../../components/order-in-hand/SummaryChips';
import FilterBar from '../../../components/order-in-hand/FilterBar';
import OrdersTable from '../../../components/order-in-hand/OrdersTable';
import PaginationBar from '../../../components/common/PaginationBar';
import OrderFormModal from '../../../components/order-in-hand/OrderFormModal';
import OrderDetailModal from '../../../components/order-in-hand/OrderDetailModal';
import ImportOrdersModal from '../../../components/order-in-hand/ImportOrdersModal';
import { useOrders, useClients, usePoEnquiries, useOrderMutations, fetchEnquiryPrefill, exportOrdersExcel } from '../../../components/order-in-hand/hooks';
import { emptyForm, orderToForm, formToPayload, emptyAddress, normalizeName, emptyPayment } from '../../../components/order-in-hand/utils';
import type { FormState, LineItem, Order, Payment } from '../../../components/order-in-hand/types';
import RequireRole from '../../../components/auth/RequireRole';
import { ORDER_CLIENT_ROLES } from '../../../utils/access';

export default function OrderInHandPage() {
  return (
    <RequireRole roles={ORDER_CLIENT_ROLES}>
      <OrderInHandContent />
    </RequireRole>
  );
}

function OrderInHandContent() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const tableRef = useRef<HTMLDivElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);

  const { data, isLoading, isFetching, refetch } = useOrders(search, statusFilter);
  const { data: clientsData } = useClients();
  const { data: enqData } = usePoEnquiries();

  const close = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };
  const { saveMutation, deleteMutation } = useOrderMutations(close);

  const rows = data?.data ?? [];
  const clients = clientsData?.data ?? [];
  const enquiries = enqData ?? [];

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const paged = rows.slice(startIdx, startIdx + pageSize);

  const lineTotal = useMemo(() => form.lineItems.reduce((s, li) => s + (Number(li.value) || 0), 0), [form.lineItems]);

  // When a known client name is typed (normalized match), autofill clientId +
  // currency from its country. Normalized so punctuation/case variants link.
  useEffect(() => {
    const q = normalizeName(form.clientName);
    const match = q ? clients.find((c) => normalizeName(c.name) === q) : undefined;
    if (match) {
      setForm((f) =>
        f.clientId === match.id
          ? f
          : { ...f, clientId: match.id, currency: f.currency || (match.country?.toUpperCase() !== 'INDIA' ? 'USD' : 'INR') },
      );
    }
  }, [form.clientName, clients]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }
  function openEdit(o: Order) {
    setEditingId(o.id);
    setForm(orderToForm(o));
    setModalOpen(true);
  }

  // Open the edit form from the detail view (close the read-only modal first).
  function editFromDetail(o: Order) {
    setDetail(null);
    openEdit(o);
  }

  async function importEnquiry(enquiryId: string) {
    if (!enquiryId) return;
    const p = await fetchEnquiryPrefill(enquiryId);
    setForm((f) => ({
      ...f,
      enquiryId: p.enquiryId,
      clientId: p.clientId,
      clientName: p.clientName,
      jobNo: p.jobNo,
      currency: p.currency,
      // Copy the client contact + address captured on the enquiry into the form,
      // so saving the order also back-fills them onto the client master.
      contactPerson: p.contactPerson || '',
      mobile: p.mobile || '',
      email: p.email || '',
      country: p.country || 'India',
      address: p.address ? { ...emptyAddress(), ...p.address } : emptyAddress(),
      lineItems: p.lineItems?.length ? p.lineItems : f.lineItems,
    }));
  }

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function onClientNameChange(v: string) {
    setForm((f) => {
      const q = normalizeName(v);
      const known = !!q && clients.some((c) => normalizeName(c.name) === q);
      return { ...f, clientName: v, clientId: known ? f.clientId : null };
    });
  }
  function setLine(i: number, patch: Partial<LineItem>) {
    setForm((f) => ({ ...f, lineItems: f.lineItems.map((li, idx) => (idx === i ? { ...li, ...patch } : li)) }));
  }
  function addLine() {
    setForm((f) => ({ ...f, lineItems: [...f.lineItems, { description: '', qty: 1, value: 0 }] }));
  }
  function removeLine(i: number) {
    setForm((f) => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) }));
  }
  function setPay(i: number, patch: Partial<Payment>) {
    setForm((f) => ({ ...f, payments: f.payments.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));
  }
  function addPay() {
    setForm((f) => ({ ...f, payments: [...f.payments, emptyPayment()] }));
  }
  function removePay(i: number) {
    setForm((f) => ({ ...f, payments: f.payments.filter((_, idx) => idx !== i) }));
  }

  function submit() {
    if (!form.clientName.trim()) return;
    saveMutation.mutate({ id: editingId, payload: formToPayload(form) });
  }

  function removeOrder(o: Order) {
    if (window.confirm(`Delete order ${o.poNumber || o.jobNo || o.clientName}?`)) deleteMutation.mutate(o.id);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportOrdersExcel(search, statusFilter);
    } catch (err) {
      window.alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
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
    <div className="" ref={tableRef}>
      <PageHeader refreshing={isFetching} exporting={exporting} onRefresh={() => refetch()} onExport={handleExport} onNew={openNew} onImport={() => setImportOpen(true)} />
      <SummaryChips
        count={data?.count ?? 0}
        totalINR={data?.totalINR || 0}
        openINR={data?.openINR || 0}
        openCount={data?.openCount}
        receivedINR={data?.receivedINR || 0}
        pendingINR={data?.pendingINR || 0}
      />
      <FilterBar search={search} onSearch={setSearch} status={statusFilter} onStatus={setStatusFilter} />
      <OrdersTable
        isLoading={isLoading}
        rows={rows}
        paged={paged}
        startIdx={startIdx}
        totalCount={data?.count ?? 0}
        onView={setDetail}
        onEdit={openEdit}
        onDelete={removeOrder}
      />
      {rows.length > 0 && (
        <PaginationBar
          page={currentPage}
          pageSize={pageSize}
          total={rows.length}
          onPage={changePage}
          onPageSize={changePageSize}
        />
      )}
      {modalOpen && (
        <OrderFormModal
          editingId={editingId}
          form={form}
          lineTotal={lineTotal}
          clients={clients}
          enquiries={enquiries}
          saving={saveMutation.isPending}
          setField={setField}
          onClientNameChange={onClientNameChange}
          onImport={importEnquiry}
          onLineChange={setLine}
          onAddLine={addLine}
          onRemoveLine={removeLine}
          onPayChange={setPay}
          onAddPay={addPay}
          onRemovePay={removePay}
          onSubmit={submit}
          onClose={close}
        />
      )}
      {importOpen && (
        <ImportOrdersModal
          onClose={() => setImportOpen(false)}
          onImported={() => refetch()}
        />
      )}
      {detail && (
        <OrderDetailModal order={detail} onClose={() => setDetail(null)} onEdit={editFromDetail} />
      )}
    </div>
  );
}
