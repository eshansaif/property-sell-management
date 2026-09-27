"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

type Inquiry = {
  id: string; name: string; phone: string; status: string; createdAt: string;
  listing: { title: string } | null;
  assignee: { name: string } | null;
};

const STATUSES = ["", "NEW", "CONTACTED", "IN_PROGRESS", "FOLLOW_UP", "CONVERTED", "CLOSED", "REJECTED"];

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const [status, setStatus] = useState("");

  async function load(s = "") {
    const res = await fetch(`/api/inquiries${s ? `?status=${s}` : ""}`);
    const data = await res.json();
    setItems(data.items);
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text-primary">Inquiries</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s || "all"}
            onClick={() => { setStatus(s); load(s); }}
            className={`rounded-full px-3 py-1 text-xs ${status === s ? "bg-primary text-primary-foreground" : "bg-surface-muted text-text-secondary hover:text-text-primary"}`}
          >
            {s ? s.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
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
            {items?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-text-secondary">No inquiries yet.</td></tr>
            )}
            {items?.map((i) => (
              <tr key={i.id} className="cursor-pointer hover:bg-surface-muted/50" onClick={() => (window.location.href = `/admin/inquiries/${i.id}`)}>
                <td className="px-4 py-3 font-medium text-text-primary">
                  <Link href={`/admin/inquiries/${i.id}`} className="hover:underline">{i.name}</Link>
                </td>
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
  );
}
