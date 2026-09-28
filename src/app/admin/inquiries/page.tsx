"use client";

import { useToast } from "@/components/ui/Toast";
import { safeFetch, readError } from "@/lib/safe-fetch";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";

type Inquiry = {
  id: string; name: string; phone: string; status: string; createdAt: string;
  listing: { title: string } | null;
  assignee: { name: string } | null;
};

const STATUSES = ["", "NEW", "CONTACTED", "IN_PROGRESS", "FOLLOW_UP", "CONVERTED", "CLOSED", "REJECTED"];

export default function AdminInquiriesPage() {
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const load = useCallback(async (s: string, p: number) => {
    setItems(null);
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    params.set("page", String(p));
    const res = await safeFetch(`/api/inquiries?${params.toString()}`);
    if (!res.ok) {
      toast.error("Couldn't load inquiries", await readError(res));
      setItems([]);
      return;
    }
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
  }, []);

  useEffect(() => { load(status, page); }, [status, page, load]);

  function onStatusChange(s: string) {
    setStatus(s);
    setPage(1);
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">Inquiries</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s || "all"}
            onClick={() => onStatusChange(s)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${status === s ? "bg-primary text-primary-foreground" : "bg-surface-muted text-text-secondary hover:text-text-primary"}`}
          >
            {s ? s.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-muted text-left text-xs text-text-secondary">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items === null && <TableSkeleton rows={6} cols={6} />}
              {items?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-14 text-center text-text-secondary">No inquiries yet.</td></tr>
              )}
              {items?.map((i) => (
                <tr
                  key={i.id}
                  className="cursor-pointer hover:bg-surface-muted/50"
                  onClick={() => router.push(`/admin/inquiries/${i.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-text-primary">{i.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{i.phone}</td>
                  <td className="px-4 py-3 text-text-secondary">{i.listing?.title ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                  <td className="px-4 py-3 text-text-secondary">{i.assignee?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(i.createdAt).toLocaleDateString()}</td>
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
