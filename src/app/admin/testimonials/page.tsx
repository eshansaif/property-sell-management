"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { useDebounced } from "@/components/ui/useDebounced";
import { safeFetch, readError } from "@/lib/safe-fetch";

type Row = { id: string; authorName: string; authorRole: string | null; content: string; rating: number | null; isActive: boolean };

export default function AdminTestimonialsPage() {
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
    const p = new URLSearchParams({ admin: "1", page: String(page) });
    if (dq) p.set("q", dq);
    if (active) p.set("active", active);
    const res = await safeFetch(`/api/testimonials?${p}`);
    if (!res.ok) { toast.error("Couldn't load testimonials", await readError(res)); setItems([]); return; }
    const data = await res.json();
    setItems(data.items); setTotal(data.total);
  }, [dq, active, page, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dq, active]);

  async function handleDelete(r: Row) {
    if (!confirm(`Delete testimonial from "${r.authorName}"?`)) return;
    const res = await safeFetch(`/api/testimonials/${r.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Couldn't delete testimonial", await readError(res));
    toast.success("Testimonial deleted");
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-text-primary">Testimonials</h1>
          <p className="mt-1 text-sm text-text-secondary">Customer quotes shown on the homepage.</p>
        </div>
        <Link href="/admin/testimonials/new" className="btn-primary">Add testimonial</Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name or text..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search testimonials" />
        <select className="input max-w-[160px]" value={active} onChange={(e) => setActive(e.target.value)} aria-label="Filter by visibility">
          <option value="">All</option>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-muted text-left text-xs text-text-secondary">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Testimonial</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Visible</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items === null && <TableSkeleton rows={4} cols={5} />}
              {items?.length === 0 && <tr><td colSpan={5} className="px-4 py-14 text-center text-text-secondary">{dq || active ? "No testimonials match your filters." : "No testimonials yet."}</td></tr>}
              {items?.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3"><p className="font-medium text-text-primary">{r.authorName}</p>{r.authorRole && <p className="text-xs text-text-secondary">{r.authorRole}</p>}</td>
                  <td className="max-w-xs px-4 py-3 text-text-secondary"><p className="line-clamp-2">{r.content}</p></td>
                  <td className="px-4 py-3 text-text-secondary">{r.rating ? `${r.rating}/5` : "—"}</td>
                  <td className="px-4 py-3"><span className={`badge ${r.isActive ? "bg-success/10 text-success" : "bg-surface-muted text-text-secondary"}`}>{r.isActive ? "Visible" : "Hidden"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/testimonials/${r.id}/edit`} className="mr-3 text-accent hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(r)} className="text-error hover:underline">Delete</button>
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
