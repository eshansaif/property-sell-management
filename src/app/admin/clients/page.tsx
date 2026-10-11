"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { useDebounced } from "@/components/ui/useDebounced";
import { safeFetch, readError } from "@/lib/safe-fetch";

type ClientRow = { id: string; name: string; logoUrl: string; websiteUrl: string | null; isActive: boolean; displayOrder: number };

export default function AdminClientsPage() {
  const toast = useToast();
  const [items, setItems] = useState<ClientRow[] | null>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const dq = useDebounced(q);

  const load = useCallback(async () => {
    setItems(null);
    const p = new URLSearchParams({ admin: "1", page: String(page) });
    if (dq) p.set("q", dq);
    if (active) p.set("active", active);
    const res = await safeFetch(`/api/clients?${p}`);
    if (!res.ok) {
      toast.error("Couldn't load clients", await readError(res));
      setItems([]);
      return;
    }
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
  }, [dq, active, page, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dq, active]);

  async function handleDelete(c: ClientRow) {
    if (!confirm(`Remove "${c.name}" from the homepage?`)) return;
    const res = await safeFetch(`/api/clients/${c.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Couldn't remove client", await readError(res));
    toast.success("Client removed");
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-text-primary">Clients</h1>
          <p className="mt-1 text-sm text-text-secondary">Logos shown in the "Trusted by" section on the homepage.</p>
        </div>
        <Link href="/admin/clients/new" className="btn-primary">Add client</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search clients..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" />
        <select className="input max-w-[160px]" value={active} onChange={(e) => setActive(e.target.value)} aria-label="Filter by visibility">
          <option value="">All</option>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-surface-muted text-left text-xs text-text-secondary">
              <tr>
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Visible</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items === null && <TableSkeleton rows={4} cols={4} />}
              {items?.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-14 text-center text-text-secondary">No clients added yet. Add your first logo to show the "Trusted by" section on the homepage.</td></tr>
              )}
              {items?.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border bg-surface-muted">
                      <Image src={c.logoUrl} alt={c.name} fill className="object-contain p-1" sizes="40px" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${c.isActive ? "bg-success/10 text-success" : "bg-surface-muted text-text-secondary"}`}>
                      {c.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/clients/${c.id}/edit`} className="mr-3 text-accent hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(c)} className="text-error hover:underline">Remove</button>
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
