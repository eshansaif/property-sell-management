"use client";

import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";

type SubService = {
  id: string; name: string; status: string;
  service: { name: string };
  _count: { listings: number };
};

export default function AdminSubServicesPage() {
  const toast = useToast();
  const [items, setItems] = useState<SubService[] | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (query: string, p: number) => {
    setItems(null);
    const params = new URLSearchParams({ page: String(p) });
    if (query) params.set("q", query);
    const res = await safeFetch(`/api/sub-services?${params.toString()}`);
    if (!res.ok) {
      toast.error("Couldn't load sub-services", await readError(res));
      setItems([]);
      return;
    }
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
  }, []);

  useEffect(() => { load(q, page); }, [page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSearchChange(value: string) {
    setQ(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(value, 1); }, 350);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sub-service? If it has listings, it will be archived instead.")) return;
    const res = await safeFetch(`/api/sub-services/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete sub-service", await readError(res));
      return;
    }
    const result = await res.json().catch(() => ({}));
    if (result.archived) toast.info("Sub-service archived", "It is in use, so it was archived instead of deleted.");
    else toast.success("Sub-service deleted");
    load(q, page);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-text-primary">Sub-services</h1>
        <Link href="/admin/sub-services/new" className="btn-primary">New sub-service</Link>
      </div>

      <div className="mb-4">
        <input className="input max-w-xs" placeholder="Search sub-services..." value={q} onChange={(e) => onSearchChange(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-muted text-left text-xs text-text-secondary">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Listings</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items === null && <TableSkeleton rows={6} cols={5} />}
              {items?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-14 text-center text-text-secondary">No sub-services found.</td></tr>
              )}
              {items?.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">{s.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.service.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-text-secondary">{s._count.listings}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/sub-services/${s.id}/edit`} className="mr-3 text-accent hover:underline">Edit</Link>
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
