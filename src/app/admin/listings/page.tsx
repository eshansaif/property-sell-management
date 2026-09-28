"use client";

import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Combobox } from "@/components/ui/Combobox";

type Listing = {
  id: string; title: string; status: string; priceLabel: string | null;
  service: { name: string }; subService: { name: string };
};
type Service = { id: string; name: string };

export default function AdminListingsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Listing[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
  }, []);

  const load = useCallback(async (query: string, s: string, svc: string, p: number) => {
    setItems(null);
    const params = new URLSearchParams({ page: String(p) });
    if (query) params.set("q", query);
    if (s) params.set("status", s);
    if (svc) params.set("serviceId", svc);
    const res = await safeFetch(`/api/listings?${params.toString()}`);
    if (!res.ok) {
      toast.error("Couldn't load listings", await readError(res));
      setItems([]);
      return;
    }
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
  }, []);

  useEffect(() => { load(q, status, serviceId, page); }, [page, status, serviceId, load]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSearchChange(value: string) {
    setQ(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(value, status, serviceId, 1); }, 350);
  }

  async function handleArchive(id: string) {
    if (!confirm("Archive this listing?")) return;
    const res = await safeFetch(`/api/listings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't archive listing", await readError(res));
      return;
    }
    const result = await res.json().catch(() => ({}));
    if (result.archived) toast.info("Listing archived", "It is in use, so it was archived instead of deleted.");
    else toast.success("Listing archived");
    load(q, status, serviceId, page);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-text-primary">All Listings</h1>
        <Link href="/admin/listings/new" className="btn-primary">New listing</Link>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <input className="input" placeholder="Search by title..." value={q} onChange={(e) => onSearchChange(e.target.value)} />
        <Combobox
          options={services.map((s) => ({ value: s.id, label: s.name }))}
          value={serviceId}
          onChange={(v) => { setServiceId(v); setPage(1); }}
          placeholder="All services"
        />
        <Combobox
          options={[
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLISHED", label: "Published" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          placeholder="All statuses"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-muted text-left text-xs text-text-secondary">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items === null && <TableSkeleton rows={8} cols={5} />}
              {items?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-14 text-center text-text-secondary">No listings found. Create your first listing to start receiving customer inquiries.</td></tr>
              )}
              {items?.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">{l.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{l.service.name} / {l.subService.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{l.priceLabel ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/listings/${l.id}/edit`} className="mr-3 text-accent hover:underline">Edit</Link>
                    <button onClick={() => handleArchive(l.id)} className="text-error hover:underline">Archive</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
