"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Combobox } from "@/components/ui/Combobox";
import { useDebounced } from "@/components/ui/useDebounced";
import { safeFetch, readError } from "@/lib/safe-fetch";

type Row = {
  id: string; action: string; entity: string; entityId: string; previous: string | null; next: string | null; createdAt: string;
  user: { name: string; email: string } | null;
};

const ACTIONS = ["CREATE", "UPDATE", "DELETE"];

function pretty(json: string | null) {
  if (!json) return "—";
  try { return JSON.stringify(JSON.parse(json), null, 2); } catch { return json; }
}

export default function AuditLogPage() {
  const toast = useToast();
  const [items, setItems] = useState<Row[] | null>(null);
  const [entities, setEntities] = useState<string[]>([]);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const pageSize = 25;
  const dq = useDebounced(q);

  const load = useCallback(async () => {
    setItems(null);
    const p = new URLSearchParams({ page: String(page) });
    if (entity) p.set("entity", entity);
    if (action) p.set("action", action);
    if (dq) p.set("q", dq);
    const res = await safeFetch(`/api/admin/audit-logs?${p}`);
    if (!res.ok) { toast.error("Couldn't load audit log", await readError(res)); setItems([]); return; }
    const data = await res.json();
    setItems(data.items); setTotal(data.total); setEntities(data.entities);
  }, [entity, action, dq, page, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [entity, action, dq]);

  return (
    <div>
      <h1 className="font-display text-2xl text-text-primary">Audit Log</h1>
      <p className="mt-1 mb-6 text-sm text-text-secondary">Who changed what, and when. Visible to Super Admins only.</p>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Combobox options={entities.map((e) => ({ value: e, label: e }))} value={entity} onChange={setEntity} placeholder="All record types" />
        <Combobox options={ACTIONS.map((a) => ({ value: a, label: a }))} value={action} onChange={setAction} placeholder="All actions" />
        <input className="input" placeholder="Search by record ID..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search by record ID" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-surface-muted text-left text-xs text-text-secondary">
              <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Record</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items === null && <TableSkeleton rows={6} cols={5} />}
              {items?.length === 0 && <tr><td colSpan={5} className="px-4 py-14 text-center text-text-secondary">No activity found.</td></tr>}
              {items?.map((r) => (
                <Fragment key={r.id}>
                  <tr>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-primary">{r.user?.name ?? "System"}</td>
                    <td className="px-4 py-3"><span className="badge bg-surface-muted text-text-primary">{r.action}</span></td>
                    <td className="px-4 py-3 text-text-secondary">{r.entity} <span className="text-xs">· {r.entityId.slice(0, 8)}</span></td>
                    <td className="px-4 py-3 text-right">
                      {(r.previous || r.next) && (
                        <button className="text-accent hover:underline" onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? "Hide" : "Details"}</button>
                      )}
                    </td>
                  </tr>
                  {open === r.id && (
                    <tr className="bg-surface-muted/50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div><p className="mb-1 text-xs font-medium text-text-secondary">Before</p><pre className="max-h-64 overflow-auto rounded-md bg-surface p-3 text-xs">{pretty(r.previous)}</pre></div>
                          <div><p className="mb-1 text-xs font-medium text-text-secondary">After</p><pre className="max-h-64 overflow-auto rounded-md bg-surface p-3 text-xs">{pretty(r.next)}</pre></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
