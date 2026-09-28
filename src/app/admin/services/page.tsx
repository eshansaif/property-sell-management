"use client";

import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";

type Service = {
  id: string;
  name: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  _count: { listings: number; subServices: number };
};

export default function AdminServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState<Service[] | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (query: string, p: number) => {
    setServices(null);
    const params = new URLSearchParams({ page: String(p) });
    if (query) params.set("q", query);
    const res = await safeFetch(`/api/services?${params.toString()}`);
    if (!res.ok) {
      toast.error("Couldn't load services", await readError(res));
      setServices([]);
      return;
    }
    const data = await res.json();
    setServices(data.items);
    setTotal(data.total);
  }, []);

  useEffect(() => { load(q, page); }, [page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSearchChange(value: string) {
    setQ(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(value, 1);
    }, 350);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service? If it has listings, it will be archived instead.")) return;
    const res = await safeFetch(`/api/services/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete service", await readError(res));
      return;
    }
    const result = await res.json().catch(() => ({}));
    if (result.archived) toast.info("Service archived", "It is in use, so it was archived instead of deleted.");
    else toast.success("Service deleted");
    load(q, page);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-text-primary">Services</h1>
        <Link href="/admin/services/new" className="btn-primary">New service</Link>
      </div>

      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search services..."
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-muted text-left text-xs text-text-secondary">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sub-services</th>
                <th className="px-4 py-3">Listings</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services === null && <TableSkeleton rows={6} cols={5} />}
              {services?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-14 text-center text-text-secondary">No services found. Create your first one to get started.</td></tr>
              )}
              {services?.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">{s.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-text-secondary">{s._count.subServices}</td>
                  <td className="px-4 py-3 text-text-secondary">{s._count.listings}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/services/${s.id}/edit`} className="mr-3 text-accent hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(s.id)} className="text-error hover:underline">Delete</button>
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
