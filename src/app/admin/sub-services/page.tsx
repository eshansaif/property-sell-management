"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

type SubService = {
  id: string; name: string; status: string;
  service: { name: string };
  _count: { listings: number };
};

export default function AdminSubServicesPage() {
  const [items, setItems] = useState<SubService[] | null>(null);

  async function load() {
    const res = await fetch("/api/sub-services");
    setItems(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this sub-service? If it has listings, it will be archived instead.")) return;
    await fetch(`/api/sub-services/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-text-primary">Sub-services</h1>
        <Link href="/admin/sub-services/new" className="btn-primary">New sub-service</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
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
            {items?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-text-secondary">No sub-services yet.</td></tr>
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
  );
}
