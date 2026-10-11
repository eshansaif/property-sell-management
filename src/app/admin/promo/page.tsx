"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { useDebounced } from "@/components/ui/useDebounced";
import { safeFetch, readError } from "@/lib/safe-fetch";

type Row = { id: string; label: string | null; badge: string | null; customUrl: string | null; isActive: boolean; displayOrder: number; listing: { title: string; status: string } | null };

export default function AdminPromoPage() {
  const toast = useToast();
  const [items, setItems] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const dq = useDebounced(q);

  const load = useCallback(async () => {
    setItems(null);
    const p = new URLSearchParams({ page: String(page) });
    if (dq) p.set("q", dq);
    if (active) p.set("active", active);
    const res = await safeFetch(`/api/promo?${p}`);
    if (!res.ok) { toast.error("Couldn't load promos", await readError(res)); setItems([]); return; }
    const data = await res.json();
    setItems(data.items); setTotal(data.total);
  }, [dq, active, page, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dq, active]);

  async function handleDelete(r: Row) {
    if (!confirm("Remove this item from the banner?")) return;
    const res = await safeFetch(`/api/promo/${r.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Couldn't remove promo", await readError(res));
    toast.success("Promo removed");
    load();
  }

  async function toggle(r: Row) {
    const res = await safeFetch(`/api/promo/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !r.isActive }) });
    if (!res.ok) return toast.error("Couldn't update promo", await readError(res));
    toast.success(r.isActive ? "Hidden from banner" : "Now showing in banner");
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-text-primary">Promo Banner</h1>
          <p className="mt-1 text-sm text-text-secondary">Scrolling strip at the very top of the homepage. Each item opens a listing or a custom link.</p>
        </div>
        <Link href="/admin/promo/new" className="btn-primary">Add promo</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search label or listing..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search promos" />
        <select className="input max-w-[160px]" value={active} onChange={(e) => setActive(e.target.value)} aria-label="Filter by visibility">
          <option value="">All</option>
          <option value="true">Showing</option>
          <option value="false">Hidden</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-muted text-left text-xs text-text-secondary">
              <tr><th className="px-4 py-3">Text</th><th className="px-4 py-3">Goes to</th><th className="px-4 py-3">Badge</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items === null && <TableSkeleton rows={4} cols={5} />}
              {items?.length === 0 && <tr><td colSpan={5} className="px-4 py-14 text-center text-text-secondary">{dq || active ? "No promos match your filters." : "No promos yet. Add one to show the banner."}</td></tr>}
              {items?.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-text-primary">{r.label || r.listing?.title || "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {r.listing ? (<>Listing: {r.listing.title}{r.listing.status !== "PUBLISHED" && <span className="ml-2 badge bg-error/10 text-error">Not published</span>}</>) : <span className="break-all">{r.customUrl}</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{r.badge || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(r)} className={`badge ${r.isActive ? "bg-success/10 text-success" : "bg-surface-muted text-text-secondary"}`} aria-label="Toggle visibility">{r.isActive ? "Showing" : "Hidden"}</button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/promo/${r.id}/edit`} className="mr-3 text-accent hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(r)} className="text-error hover:underline">Remove</button>
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
